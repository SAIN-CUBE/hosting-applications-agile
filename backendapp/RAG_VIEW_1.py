import os
import time
import logging
from datetime import datetime, timedelta
from django.core.files.storage import default_storage
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from langchain_groq import ChatGroq
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain.prompts import ChatPromptTemplate
from langchain.chains import RetrievalQA
from langchain_huggingface import HuggingFaceEmbeddings
from .models import PDFDocument
import pandas as pd
import shutil
from faiss import IndexFlatL2
import re
from langchain_community.docstore.in_memory import InMemoryDocstore
from .models import AITool, ToolUsage, Credit, ApiCallLog
from django.utils.timezone import now
from .authentication import SIDAuthentication

User = get_user_model()
# Set your Groq API key
os.environ["GROQ_API_KEY"] = "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"

#Load and split pdfs
def load_and_split_pdf(pdf_path):
    try:
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"The PDF file does not exist at path: {pdf_path}")

        logging.info(f"Loading PDF from {pdf_path}")
        loader = PyPDFLoader(pdf_path)
        pages = loader.load()
        logging.info(f"Successfully loaded {len(pages)} pages from the PDF")

        logging.info("Splitting the document into chunks")
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        docs = text_splitter.split_documents(pages)
        
        if not docs:
            raise ValueError("Document splitting resulted in an empty list of documents.")
        logging.info(f"Successfully split the document into {len(docs)} chunks")

        output_dir = 'output'
        os.makedirs(output_dir, exist_ok=True)
        output_text_file_path = os.path.join(output_dir, 'text.txt')

        logging.info(f"Saving extracted text to {output_text_file_path}")
        with open(output_text_file_path, 'w', encoding='utf-8') as f:
            for i, doc in enumerate(docs):
                try:
                    f.write(f"--- Document {i + 1} ---\n")
                    f.write(doc.page_content)
                    f.write("\n\n")
                except Exception as e:
                    logging.error(f"Error writing chunk {i + 1} to file: {e}")

        logging.info(f"Text extracted and saved to {output_text_file_path}")
        return docs

    except FileNotFoundError as e:
        logging.error(f"File not found error: {e}")
    except ValueError as e:
        logging.error(f"Value error (possibly due to corrupt PDF): {e}")
    except PermissionError as e:
        logging.error(f"Permission error (check file access rights): {e}")
    except Exception as e:
        logging.error(f"Unexpected error in load_and_split_pdf: {e}")
    
    return None


def create_or_load_user_vector_store(user):
    vector_store_path = f'document_embeddings/{user.id}'

    try:
        # Check if vector store already exists
        if os.path.exists(vector_store_path):
            logging.info("Loading existing user vector store...")
            return FAISS.load_local(vector_store_path, HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2"), allow_dangerous_deserialization=True)
        else:
            # Return None if no vector store exists yet, will be created later when processing documents
            logging.info("No vector store found, will create new one.")
            return None

    except Exception as e:
        logging.error(f"Error creating or loading vector store: {e}")
        raise


def setup_rag_chain(vector_store):
    llm = ChatGroq(
        model="mixtral-8x7b-32768",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )
    
    retriever = vector_store.as_retriever(search_kwargs={"k": 3})
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an AI assistant tasked with answering questions based on the provided document. Your goal is to give direct and concise answers to the user's questions without adding explanations or references about where the information was found. If the answer is not in the document, simply state 'I don't know.' Do not provide any additional context or details beyond the direct answer."),
        ("human", "Context: {context}\n\nQuestion: {question}")
    ])
    
    rag_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt}
    )
    
    return rag_chain

class RAGUploadView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SIDAuthentication]

    # POST: Handle document uploads and update the vector store
    def post(self, request):
        # get multiple pdfs in one request
        files = request.FILES.getlist('file')
        logging.info(f"Files uploaded {files}")
        print(len(files))

        if not files:
            logging.info(f"No file provided")
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        errors = []
        success_files = []

        for file in files:
            user = request.user
            prev_file_path = f'tmp/{user.id}/{file.name}'

            # Check if file is a valid PDF
            if not file.name.lower().endswith('.pdf'):
                errors.append(f"{file.name} is not a PDF file")
                continue

            # Check if the file already exists in the database
            if PDFDocument.objects.filter(file_path=prev_file_path, user=user).exists():
                errors.append(f"A file with the name {file.name} already exists in the database.")
                continue

            # Check if the file already exists in default storage
            if default_storage.exists(prev_file_path):
                errors.append(f"A file with the name {file.name} already exists in storage.")
                continue

            # Save the file to default storage
            file_path = default_storage.save(prev_file_path, ContentFile(file.read()))

            try:
                # Load or create the user-specific vector store
                vector_store = create_or_load_user_vector_store(user)
                logging.info(f"Vector store created..")

                # Store PDF metadata in the database
                pdf_doc, created = PDFDocument.objects.get_or_create(
                    file_path=file_path,
                    user=user
                )

                # Process the document and split it into chunks
                docs = load_and_split_pdf(file_path)
                logging.info(f"Docs added in the vector store..")
                if not docs:
                    errors.append(f"Failed to process the document {file.name}")
                    continue

                # If vector store exists, update it. Otherwise, create a new one.
                if vector_store:
                    logging.info("Updating existing vector store with new documents.")
                    vector_store.add_documents(docs)
                else:
                    logging.info("Creating new vector store for user.")
                    vector_store = FAISS.from_documents(docs, HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2"))

                # Save the updated vector store to disk
                vector_store.save_local(f'document_embeddings/{user.id}')
                success_files.append(file.name)

            except Exception as e:
                errors.append(f"An error occurred while processing {file.name}: {str(e)}")
                continue

        # Return a response after processing all files
        if errors:
            logging.info(f"Getting erroes :{errors}")
            return Response({"errors": errors, "processed_files": success_files}, status=status.HTTP_207_MULTI_STATUS)
        else:
            logging.info(f"All documents uploaded and vector store updated successfully.")
            return Response({
                "message": "All documents uploaded and vector store updated successfully.",
                "processed_files": success_files
            }, status=status.HTTP_200_OK)
            

class RAGGETView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SIDAuthentication]
    
    def post(self, request):
        return self.process_request(request)

    def get(self, request):
        return self.process_request(request)

    def process_request(self, request):
        user = request.user
        vector_store_path = f'document_embeddings/{user.id}'
        
        # Extract the source identifier from custom header or fallback to "api"
        source = request.headers.get('Call-Source', 'api')  # Default to 'api' if header not provided

        # Validate source (only allow "app" or "api")
        if source not in ['app', 'api']:
            return Response({'error': 'Invalid source. Must be "app" or "api".'}, status=400)

        # Check if the user's vector store exists
        if not os.path.exists(vector_store_path):
            logging.info("No documents in the database")
            return Response({"error": "Please upload a document first."}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Load the existing vector store
            vector_store = FAISS.load_local(vector_store_path, HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2"), allow_dangerous_deserialization=True)
            logging.info(f"Existing vector store loaded..")
        except Exception as e:
            logging.error(f"Error loading vector store: {e}")
            return Response({"error": "Failed to load docs"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Extract the question from request data (works for both GET and POST)
        question = request.data.get('question')
        if not question:
            logging.error("No question provided")
            return Response({"error": "No question provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Set up the RAG chain with the vector store
        rag_chain = setup_rag_chain(vector_store)

        start_time = time.time()
        result = rag_chain.invoke({"query": question})
        end_time = time.time()
        
        count = len(re.findall(r'\w+', result['result']))
        print(count)
        
        try:
            # Directly handle the credit deduction for this tool usage
            logging.info("Deducting credits...")
            self.deduct_credits(request.user, count,  "chat-with-pdf", source)
            logging.info(f"Credits deducted for {request.user.email} for chat-with-pdf")
            logging.info(f"question : {question} \n response:{result['result']}")
            return Response({
                "answer": result['result'],
                "time_taken": end_time - start_time
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error creating ApiCallLog: {e}")
            return Response({"error": f"error : {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

    def deduct_credits(self, user, tokens_used, tool_name, source):
        """
        Directly handle credit deduction within the CNIC extraction view.
        Accumulate tool usage for the same day if the same tool is used multiple times.
        """
        try:
            # Fetch the tool details
            tool = AITool.objects.get(tool_name=tool_name)

            # Get the user's credits
            credits = Credit.objects.get(user=user)
            print(credits.remaining_credits)
            print(tokens_used)

            # Check if user has enough credits
            if credits.remaining_credits >= tokens_used:
                # Deduct credits and update the user's credits
                credits.remaining_credits -= tokens_used
                credits.used_credits += tokens_used
                credits.save()

                # Get today's date
                today = str(now().date())
                print(today)

                # Check if a ToolUsage entry exists for this user, tool, and today's date
                tool_usage_qs = ToolUsage.objects.filter(used_by=user, tool_name=tool_name, used_at=today)
                print("Filtered object", tool_usage_qs)


                if tool_usage_qs.exists():
                    # If a record already exists for today, accumulate the credits used
                    print("Inside filtered object")
                    tool_usage = tool_usage_qs.first()
                    tool_usage.credits_used += tokens_used
                    tool_usage.remaining_credits = credits.remaining_credits
                    tool_usage.save()
                    logging.info(f"Credits accumulated for {user.email}: {tokens_used} tokens added for {tool_name} on {today}.")
                else:
                    print("Inside else")
                    # If no record exists for today, create a new one
                    ToolUsage.objects.create(
                        used_by=user,
                        tool_name=tool_name,
                        used_at=today,
                        credits_used=tokens_used,
                        remaining_credits=credits.remaining_credits
                    )
                    
                try:
                # Create the API call log object
                    ApiCallLog.objects.create(
                        user=user,
                        tool_name='chat-with-pdf',
                        credits_used=tokens_used,
                        source = source,
                        timestamp=now()
                    )
                    print("API call log created successfully.")
                except Exception as e:
                    print(f"Error creating ApiCallLog: {e}")
                logging.info(f"Credits deducted for user {user.email}: {tokens_used} tokens used today for {tool_name}.")
            else:
                logging.warning(f"User {user.email} has insufficient credits for {tool_name}.")
                raise ValueError("Insufficient credits")

        except AITool.DoesNotExist:
            logging.error(f"Tool {tool_name} not found.")
            raise ValueError("Tool not found")
            
        except Credit.DoesNotExist:
            logging.error(f"Credit record for user {user.email} not found.")
            raise ValueError(f"Credit record for user {user.email} not found.")
        except Exception as e:
            logging.error(f"Error deducting credits for user {user.email}: {e}")
            raise e

                
             
class RAGDELETEView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SIDAuthentication]
    
    # DELETE: Delete vector store and recreate it
    def delete(self, request):
        document_names = request.data.get('document_names')
        if not document_names or not isinstance(document_names, list):
            return Response({"error": "No document names provided or invalid format."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        vector_store_path = f'document_embeddings/{user.id}'

        # Check if the vector store exists
        if not os.path.exists(vector_store_path):
            logging.error(f"No vector store found for the user")
            return Response({"error": "No vector store found for the user"}, status=status.HTTP_404_NOT_FOUND)

        deleted_files = []
        errors = []

        # Iterate over the provided document names and delete each document
        for document_name in document_names:
            try:
                # Try to retrieve the PDFDocument entry from the database for the user
                pdf_doc = PDFDocument.objects.get(file_path=f'tmp/{user.id}/{document_name}', user=user)
            except PDFDocument.DoesNotExist:
                errors.append(f"Document '{document_name}' not found in the database or not owned by the user")
                continue

            # Delete the document's file from storage
            file_path = pdf_doc.file_path
            if os.path.exists(file_path):
                os.remove(file_path)
                logging.info(f"Deleted PDF file: {file_path}")
                deleted_files.append(document_name)
            else:
                errors.append(f"File '{document_name}' does not exist on disk")
                continue

            # Delete the PDFDocument record from the database
            pdf_doc.delete()

        # Check if there are any remaining PDFs for the user
        remaining_pdfs = PDFDocument.objects.filter(user=user).values_list('file_path', flat=True)
        if not remaining_pdfs:
            # If no remaining PDFs, delete the vector store directory
            shutil.rmtree(vector_store_path)
            logging.info(f"Deleted vector store as no remaining documents exist for the user {user.id}.")
            return Response({
                "message": f"Documents deleted: {deleted_files}. No more documents remain, vector store removed.",
                "errors": errors
            }, status=status.HTTP_200_OK)

        try:
            # Rebuild the vector store from the remaining documents
            embeddings_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
            dimensions: int = len(embeddings_model.embed_query("dummy"))
            
            # Create a new FAISS vector store
            vector_store = FAISS(
                embedding_function=embeddings_model,
                index=IndexFlatL2(dimensions),
                docstore=InMemoryDocstore(),
                index_to_docstore_id={},
                normalize_L2=False
            )

            # Reprocess the remaining documents
            for pdf_path in remaining_pdfs:
                # Extract content and split it into chunks
                docs = load_and_split_pdf(pdf_path)
                if docs:
                    vector_store.add_documents(docs)

            # Save the updated vector store
            vector_store.save_local(vector_store_path)
            logging.info(f"Rebuilt the vector store for user {user.id} after deletion.")

            return Response({
                "message": f"Documents deleted: {deleted_files}.",
                "errors": errors
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logging.error(f"Error rebuilding vector store after deletion: {e}")
            return Response({"error": "Failed to rebuild vector store"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        