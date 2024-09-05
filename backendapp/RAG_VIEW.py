import os
import time
from django.http import JsonResponse
from django.views import View
from langchain_groq import ChatGroq
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain.prompts import ChatPromptTemplate
from langchain.chains import RetrievalQA
from langchain_huggingface import HuggingFaceEmbeddings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import IsAuthenticated, AllowAny
from io import BytesIO
import warnings

# Set your Groq API key
os.environ["GROQ_API_KEY"] = os.environ.get('GROQ_API_KEY')

# Suppress warnings for deprecated methods
warnings.filterwarnings("ignore", category=FutureWarning)

@method_decorator(csrf_exempt, name='dispatch')
class RAGView(View):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return JsonResponse({'message': 'Please use POST method to ask a question.'})

    def post(self, request, *args, **kwargs):
        pdf_file = request.FILES.get('pdf')
        question = request.POST.get('question')

        if not pdf_file:
            return JsonResponse({'error': 'No PDF file provided'}, status=400)
        if not pdf_file.name.lower().endswith('.pdf'):
            return JsonResponse({'error': 'The uploaded file must be a PDF.'}, status=400)
        if not question:
            return JsonResponse({'error': 'No question provided'}, status=400)

        # Save the uploaded PDF file temporarily
        pdf_path = f"temp_{pdf_file.name}"
        with open(pdf_path, 'wb') as f:
            for chunk in pdf_file.chunks():
                f.write(chunk)

        try:
            # Load the data from the uploaded PDF
            loader = PyPDFLoader(pdf_path)
            pages = loader.load()

            # Extract text from all pages
            text = "".join([page.page_content for page in pages])

            # Split the text
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            splits = text_splitter.split_text(text)

            # Create embeddings and FAISS vector store
            embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
            vector_store = FAISS.from_texts(texts=splits, embedding=embeddings)

            # RAG Setup
            retriever = vector_store.as_retriever()

            # Create a chat prompt template
            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You are a helpful assistant that answers questions based on the given context.",
                    ),
                    ("human", "Context: {context}\n\nQuestion: {question}"),
                ]
            )
            
            # Initialize the ChatGroq model
            llm = ChatGroq(
                model="llama3-groq-8b-8192-tool-use-preview",
                temperature=0,
                max_tokens=None,
                timeout=None,
                max_retries=2,
            )
            
            # Create the RAG chain
            rag_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=retriever,
                return_source_documents=True,
                chain_type_kwargs={"prompt": prompt}
            )

            # Run the question through the RAG chain
            start_time = time.time()
            result = rag_chain.invoke({"query": question})
            end_time = time.time()

            return JsonResponse({
                'result': result['result'],
                'execution_time': f"{end_time - start_time} seconds"
            })

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

        finally:
            # Clean up the temporary file
            os.remove(pdf_path)
