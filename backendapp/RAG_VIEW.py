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
from langchain_community.docstore.in_memory import InMemoryDocstore

User = get_user_model()

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

class RAGView(APIView):
    permission_classes = [IsAuthenticated]
    
    # POST: Handle document uploads and update the vector store
    def post(self, request):
        # get only a single pdf at a time
        # file = request.FILES.get('file')
        
        # get multiple pdfs in one request
        files = request.FILES.getlist('file')
        print(len(files))
        if not files:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        # store each pdf in vector-store
        for file in files:
            user = request.user
            file_path = default_storage.save(f'tmp/{user.id}/{file.name}', ContentFile(file.read()))

            try:
                # Load or create the user-specific vector store
                vector_store = create_or_load_user_vector_store(user)
                
                # Store PDF metadata in the database
                pdf_doc, created = PDFDocument.objects.get_or_create(
                    file_path=file_path,
                    user=user
                )

                # Process the document and split it into chunks
                docs = load_and_split_pdf(file_path)
                if not docs:
                    return Response({"error": "Failed to process the document"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # If vector store exists, update it. Otherwise, create a new one.
                if vector_store:
                    logging.info("Updating existing vector store with new documents.")
                    vector_store.add_documents(docs)
                else:
                    logging.info("Creating new vector store for user.")
                    vector_store = FAISS.from_documents(docs, HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2"))

                # Save the updated vector store to disk
                vector_store.save_local(f'document_embeddings/{user.id}')

                return Response({
                    "message": "Document uploaded and vector store updated successfully."
                }, status=status.HTTP_200_OK)

            except:
                pass

    # GET: Handle question answering using the existing vector store
    def get(self, request):
        user = request.user
        vector_store_path = f'document_embeddings/{user.id}'

        # Check if the user's vector store exists
        if not os.path.exists(vector_store_path):
            return Response({"error": "Please upload a document first."}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Load the existing vector store
            vector_store = FAISS.load_local(vector_store_path, HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2"), allow_dangerous_deserialization=True)
        except Exception as e:
            logging.error(f"Error loading vector store: {e}")
            return Response({"error": "Failed to load docs"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Extract the question from query parameters
        question = request.data.get('question')
        if not question:
            return Response({"error": "No question provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Set up the RAG chain with the vector store
        rag_chain = setup_rag_chain(vector_store)

        start_time = time.time()
        result = rag_chain.invoke({"query": question})
        end_time = time.time()

        return Response({
            "answer": result['result'],
            "time_taken": end_time - start_time
        }, status=status.HTTP_200_OK)
                
             
    # DELETE: Deleted vector store and recreate it            
    def delete(self, request):
        document_name = request.data.get('document_name')
        if not document_name:
            return Response({"error": "No document name provided"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        vector_store_path = f'document_embeddings/{user.id}'

        # Check if the vector store exists
        if not os.path.exists(vector_store_path):
            logging.error(f"No vector store found for the user")
            return Response({"error": "No vector store found for the user"}, status=status.HTTP_404_NOT_FOUND)

        # Try to retrieve the PDFDocument entry from the database for the user
        try:
            pdf_doc = PDFDocument.objects.get(file_path=f'tmp/{user.id}/{document_name}', user=user)
        except PDFDocument.DoesNotExist:
            return Response({"error": "Document not found in the database or not owned by the user"}, status=status.HTTP_404_NOT_FOUND)

        # Delete the document's file from storage
        file_path = pdf_doc.file_path
        if os.path.exists(file_path):
            os.remove(file_path)
            logging.info(f"Deleted PDF file: {file_path}")
        else:
            return Response({"error": "File does not exist on disk"}, status=status.HTTP_404_NOT_FOUND)

        # Delete the PDFDocument record from the database
        pdf_doc.delete()

        # Rebuild the vector store from the remaining PDFs
        remaining_pdfs = PDFDocument.objects.filter(user=user).values_list('file_path', flat=True)
        if not remaining_pdfs:
            # If no remaining PDFs, delete the vector store directory
            shutil.rmtree(vector_store_path)
            logging.info(f"Deleted vector store as no remaining documents exist for the user {user.id}.")
            return Response({"message": "Document deleted and vector store removed as no more documents exist."}, status=status.HTTP_200_OK)

        try:
            # Load the embedding model
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

            return Response({"message": "Document deleted and vector store rebuilt successfully."}, status=status.HTTP_200_OK)

        except Exception as e:
            logging.error(f"Error rebuilding vector store after deletion: {e}")
            return Response({"error": "Failed to rebuild vector store"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


##Previous
# import os
# import time
# import logging
# import re
# from django.http import JsonResponse
# from django.views import View
# from langchain_groq import ChatGroq
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain_community.document_loaders import PyPDFLoader
# from langchain_community.vectorstores import FAISS
# from langchain.prompts import ChatPromptTemplate
# from langchain.chains import RetrievalQA
# from langchain_huggingface import HuggingFaceEmbeddings
# from django.views.decorators.csrf import csrf_exempt
# from django.utils.decorators import method_decorator
# from rest_framework.permissions import IsAuthenticated
# from .logger.logger import logging
# import warnings

# # Set up logging
# # logging.basicConfig(level=logging.DEBUG)
# # logger = logging.getLogger(__name__)

# # Set your Groq API key
# os.environ["GROQ_API_KEY"] = os.environ.get('GROQ_API_KEY')

# # Suppress warnings for deprecated methods
# warnings.filterwarnings("ignore", category=FutureWarning)

# @method_decorator(csrf_exempt, name='dispatch')
# class RAGView(View):
#     permission_classes = [IsAuthenticated]

#     def get(self, request, *args, **kwargs):
#         return JsonResponse({'message': 'Please use POST method to ask a question.'})

#     def post(self, request, *args, **kwargs):
#         try:
#             pdf_file = request.FILES.get('pdf')
#             question = request.POST.get('question')

#             if not pdf_file:
#                 return JsonResponse({'error': 'No PDF file provided'}, status=400)
#             if not pdf_file.name.lower().endswith('.pdf'):
#                 return JsonResponse({'error': 'The uploaded file must be a PDF.'}, status=400)
#             if not question:
#                 return JsonResponse({'error': 'No question provided'}, status=400)

#             # Process the filename
#             filename = pdf_file.name
#             logging.info(f"Pdf uploaded: {filename}")
#             logging.info(f"Query asked by user {question}")
#             # Replace spaces with underscores
#             filename = filename.replace(' ', '_')
#             # Remove any characters that aren't alphanumeric, underscore, or period
#             filename = re.sub(r'[^\w\-_\.]', '', filename)
#             # Truncate the filename if it's too long (excluding the extension)
#             max_filename_length = 50
#             name, ext = os.path.splitext(filename)
#             if len(name) > max_filename_length:
#                 name = name[:max_filename_length]
#             filename = f"{name}{ext}"

#             pdf_path = f"temp_{filename}"

#             # Save the uploaded PDF file temporarily
#             with open(pdf_path, 'wb') as f:
#                 for chunk in pdf_file.chunks():
#                     f.write(chunk)

#             # Load the data from the uploaded PDF
#             loader = PyPDFLoader(pdf_path)
#             pages = loader.load()

#             # Extract text from all pages
#             text = "".join([page.page_content for page in pages])
#             logging.info(f"Extracted text length: {len(text)}")

#             if not text:
#                 raise ValueError("No text extracted from the PDF")

#             # Split the text
#             text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
#             splits = text_splitter.split_text(text)
#             logging.info(f"Number of text splits: {len(splits)}")

#             if not splits:
#                 raise ValueError("No text splits generated")

#             # Create embeddings and FAISS vector store
#             embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
#             vector_store = FAISS.from_texts(texts=splits, embedding=embeddings)

#             # RAG Setup
#             retriever = vector_store.as_retriever()

#             # Create a chat prompt template
#             prompt = ChatPromptTemplate.from_messages([
#                 ("system", "You are a helpful assistant that answers questions based on the given context."),
#                 ("human", "Context: {context}\n\nQuestion: {question}"),
#             ])
            
#             # Initialize the ChatGroq model
#             llm = ChatGroq(
#                 model="llama3-groq-8b-8192-tool-use-preview",
#                 temperature=0,
#                 max_tokens=None,
#                 timeout=None,
#                 max_retries=2,
#             )
            
#             # Create the RAG chain
#             rag_chain = RetrievalQA.from_chain_type(
#                 llm=llm,
#                 chain_type="stuff",
#                 retriever=retriever,
#                 return_source_documents=True,
#                 chain_type_kwargs={"prompt": prompt}
#             )

#             # Run the question through the RAG chain
#             start_time = time.time()
#             result = rag_chain.invoke({"query": question})
#             end_time = time.time()
            
#             logging.info(f"Response: {result['result']}")

#             return JsonResponse({
#                 'result': result['result'],
#                 'execution_time': f"{end_time - start_time:.2f} seconds"
#             })

#         except ValueError as ve:
#             logging.info(f"ValueError in RAGView: {str(ve)}")
#             return JsonResponse({'error': str(ve)}, status=400)
#         except Exception as e:
#             logging.info(f"Error in RAGView: {str(e)}", exc_info=True)
#             return JsonResponse({'error': 'An unexpected error occurred. Please try again later.'}, status=500)

#         finally:
#             # Clean up the temporary file
#             if 'pdf_path' in locals():
#                 try:
#                     os.remove(pdf_path)
#                 except Exception as e:
#                     logging.info(f"Error removing temporary file: {str(e)}")