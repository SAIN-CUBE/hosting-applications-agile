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
from rest_framework.permissions import IsAuthenticated
import warnings

# Set your Groq API key
os.environ["GROQ_API_KEY"] = "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"

# Load the data
pdf_file = "backendapp/An-executives-guide-to-AI.pdf"
loader = PyPDFLoader(pdf_file)
pages = loader.load()

# Suppress warnings for deprecated methods
warnings.filterwarnings("ignore", category=FutureWarning)

# Extract text from all pages
text = "".join([page.page_content for page in pages])

# Split the text
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
splits = text_splitter.split_text(text)

# Create embeddings and FAISS vector store
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_store = FAISS.from_texts(texts=splits, embedding=embeddings)

# Initialize the ChatGroq model
llm = ChatGroq(
    model="llama3-groq-8b-8192-tool-use-preview",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

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

# Create the RAG chain
rag_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    return_source_documents=True,
    chain_type_kwargs={"prompt": prompt}
)

@method_decorator(csrf_exempt, name='dispatch')
class RAGView(View):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        return JsonResponse({'message': 'Please use POST method to ask a question.'})

    def post(self, request, *args, **kwargs):

        question = request.POST.get('question')
        if not question:
            return JsonResponse({'error': 'No question provided'}, status=400)

        start_time = time.time()
        result = rag_chain.invoke({"query": question})
        end_time = time.time()

        return JsonResponse({
            'result': result['result'],
            'execution_time': f"{end_time - start_time} seconds"
        })
