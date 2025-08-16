import os
from dotenv import load_dotenv
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_ibm import WatsonxEmbeddings, WatsonxLLM
from ibm_watson_machine_learning.metanames import GenTextParamsMetaNames as GenParams

# --- RAG Specific Imports ---
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_ibm import WatsonxEmbeddings, WatsonxLLM
from ibm_watson_machine_learning.metanames import GenTextParamsMetaNames as GenParams

load_dotenv()

url = os.getenv("URL")
apikey = os.getenv("API_KEY")
project_id = os.getenv("PROJECT_ID")

DIET_LINKS = [
    "https://www.medicalnewstoday.com/articles/perimenopause-diet-and-nutrition",
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC10780928/"
    # "https://www.sciencedirect.com/science/article/abs/pii/S0899900725000541",
    # "https://zoe.com/learn/perimenopause-diet",
    # "https://www.bda.uk.com/resource/menopause-diet.html",
    # "https://www.nature.com/articles/s41598-025-99406-w",
    # "https://pmc.ncbi.nlm.nih.gov/articles/PMC6947726/",
    # "https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2021.752500/full",
    # "https://www.drlouisenewson.co.uk/knowledge/healthy-eating-for-perimenopause-and-menopause",
    # "https://www.heartandstroke.ca/articles/menopause-wellness-how-to-balance-nutrition-exercise-and-heart-health",
    # "https://www.medicalnewstoday.com/articles/diet-chart-for-menopause",
    # "https://www.riversideonline.com/en/patients-and-visitors/healthy-you-blog/blog/7/7-dietary-guidelines-for-menopause",
    # "https://pmc.ncbi.nlm.nih.gov/articles/PMC12052274/",
    # "https://www.healthline.com/nutrition/menopause-diet",
    # "https://www.eatright.org/health/wellness/healthful-habits/nutrition-and-menopause",
    # "https://www.webmd.com/menopause/staying-healthy-through-good-nuitrition",
    # "https://www.narayanahealth.org/blog/menopause-diet-how-what-you-eat-affects-your-symptoms",
    # "https://www.goodrx.com/well-being/diet-nutrition/foods-for-perimenopause",
    # "https://thebms.org.uk/wp-content/uploads/2023/06/19-BMS-TfC-Menopause-Nutrition-and-Weight-Gain-JUNE2023-A.pdf",
    # "https://health.clevelandclinic.org/menopause-diet"
]


# # Initialize the LLM
# llm = WatsonxLLM(
#     model_id="ibm/granite-3-8b-instruct",
#     url=url,
#     apikey=apikey,
#     project_id=project_id,
#     params={
#         GenParams.DECODING_METHOD: "greedy",
#         GenParams.TEMPERATURE: 0.1,
#         GenParams.MIN_NEW_TOKENS: 10,
#         GenParams.MAX_NEW_TOKENS: 150,
#         GenParams.STOP_SEQUENCES: [
#             "Human:", 
#             "Observation", 
#             "Question:",
#             "USER:",
#             "ASSISTANT:",
#             "User previously asked:",
#             "You previously responded:"
#         ],
#     },
# )


# class DietAgent:
#     def __init__(self, llm):
#         self.llm = llm
#         print("Diet Agent Initialized")
    
#     def run(self, user_query, user_profile=None, user_logs=None, conversation_context=None, is_first_query=False):
#         """Run the diet agent with user context"""
        
#         # Format user context
#         profile_text = str(user_profile) if user_profile else "No user profile available"
#         logs_text = str(user_logs) if user_logs else "No previous interaction history"
#         context_text = conversation_context or "No previous conversation history"
        
#         # Simplified prompt
#         prompt = f"""You are Bloom, a personalized nutrition consultant and diet recommender for menopause wellness.

# USER PROFILE: {profile_text}
# USER SYMPTOMS: {logs_text}
# CONVERSATION HISTORY: {context_text}

# USER'S QUESTION: "{user_query}"

# INSTRUCTIONS:
# - Answer the user's specific question according to the User Profile and User symptoms to give personalized dietary advice.
# - Focus on menopause and perimenopause-friendly foods and dietary strategies
# - Use conversation history for context but don't repeat it
# - Keep response under 100 words
# - Give answer in structured bullet points and lists
# - Don't use markdown formatting
# - Be helpful and supportive
# - Maintain *empathy and understanding* in all responses

# Your response:"""
        
#         # Get response from LLM
#         try:
#             response = self.llm.invoke(prompt)
#             return {
#                 "output": response,
#                 "agent_type": "diet",
#                 "user_context_used": True
#             }
#         except Exception as e:
#             return {
#                 "output": f"I apologize, but I'm having trouble processing your nutrition question. Please try rephrasing your question or ask about specific dietary concerns.",
#                 "agent_type": "diet",
#                 "error": True
#             }


# # Initialize the LLM
# if __name__ == "__main__":
#     # Create the agent
#     agent = DietAgent(llm)
    
#     # Test data
#     test_profile = {
#         "age": 52,
#         "menopause_stage": "perimenopause",
#         "current_symptoms": ["hot flashes", "weight gain", "mood swings"],
#         "dietary_restrictions": ["lactose intolerant"],
#         "health_conditions": ["high cholesterol"],
#         "current_diet": "Mediterranean-style"
#     }
    
#     test_logs = [
#         {"query": "What foods help with hot flashes?", "timestamp": "2025-08-10"},
#         {"query": "How can I manage weight gain during menopause?", "timestamp": "2025-08-12"}
#     ]

#     # Test the agent
#     response = agent.run(
#         user_query='I am experiencing hot flashes and night sweats. What foods should I eat and avoid?',
#         user_profile=test_profile,
#         user_logs=test_logs
#     )
#     print(response)

# --- LLM and Embeddings Initialization ---
llm = WatsonxLLM(
    model_id="ibm/granite-3-8b-instruct",
    url=url,
    apikey=apikey,
    project_id=project_id,
    params={
        GenParams.DECODING_METHOD: "greedy",
        GenParams.TEMPERATURE: 0.1,
        GenParams.MIN_NEW_TOKENS: 50,
        GenParams.MAX_NEW_TOKENS: 800,  # Increased to allow complete responses
        # Reduced stop sequences to prevent premature cutting
        GenParams.STOP_SEQUENCES: ["Human:", "USER'S CURRENT QUESTION:"]
    },
)

# embeddings = WatsonxEmbeddings(
#     model_id="ibm/slate-125m-english-rtrvr",
#     url=url,
#     apikey=apikey,
#     project_id=project_id,
# )


class DietAgent:
    def __init__(self, llm: WatsonxLLM):
        self.llm = llm
        
        print("1. Initializing Diet Agent...")
        
        # Initialize embeddings
        self.documents_urls = DIET_LINKS
        self.embeddings = WatsonxEmbeddings(
            model_id="ibm/slate-125m-english-rtrvr",
            url=url,
            apikey=apikey,
            project_id=project_id,
        )
        
        # Set up RAG retriever
        self.retriever = self._setup_rag_retriever()
        
        print("\n✅ Diet Agent Initialized with RAG retriever.")

    def _setup_rag_retriever(self):
        print("2. Setting up RAG retriever...")
        print("   - Loading web documents...")
        try:
            loader = WebBaseLoader(self.documents_urls)
            loader.requests_per_second = 2
            docs = loader.load()

            print(f"   - Splitting {len(docs)} documents...")
            text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
                chunk_size=300, 
                chunk_overlap=30
            )
            doc_splits = text_splitter.split_documents(docs)

            print("   - Creating Chroma vector store...")
            vectorstore = Chroma.from_documents(
                documents=doc_splits,
                embedding=self.embeddings,
                collection_name="diet-agent-simple"
            )
            return vectorstore.as_retriever(search_kwargs={'k': 3})
        except Exception as e:
            print(f"Error setting up RAG: {e}")
            return None

    def get_dietary_information(self, query):
        """Get dietary information using RAG"""
        if not self.retriever:
            return "RAG system not available. Please try rephrasing your question."
        
        try:
            docs = self.retriever.invoke(query)
            if not docs:
                return "No specific dietary information found."
            
            # Combine relevant content
            combined_content = []
            for doc in docs[:2]:  # Use only top 2 documents
                content = doc.page_content.strip()
                if len(content) > 50:  # Only include substantial content
                    combined_content.append(content[:400])  # Limit each chunk
            
            return "\n\n".join(combined_content) if combined_content else "No relevant information found."
        except Exception as e:
            print(f"Error retrieving information: {e}")
            return "Error retrieving information. Please try again later."

    def run(self, user_query, user_profile=None, user_logs=None, conversation_context=None, is_first_query=False):
        """Run the diet agent with a simplified approach"""
        
        # Format user context
        profile_text = str(user_profile) if user_profile else "No user profile available"
        logs_text = str(user_logs) if user_logs else "No previous symptoms logged"
        context_text = str(conversation_context) if conversation_context else "This is the first question in the conversation."

        try:
            # First, get relevant dietary information
            print(f"Getting dietary information for: {user_query}")
            dietary_info = self.get_dietary_information(user_query)
            
            # Create a comprehensive prompt with context and retrieved information
            prompt = f"""You are Bloom, a supportive nutrition guide specializing in menopause wellness and dietary strategies.

USER PROFILE: {profile_text}
USER SYMPTOMS: {logs_text}
CONVERSATION HISTORY: {context_text}
USER'S QUESTION: "{user_query}"

RELEVANT DIETARY INFORMATION FROM RESEARCH:
{dietary_info}

INSTRUCTIONS:
- Provide practical, actionable dietary advice based on the user's profile and symptoms
- Suggest specific foods, meal ideas, and nutrition strategies for menopause wellness
- Focus on foods that help with symptoms and overall health
- Use bullet points for clear organization
- Keep response under 200 words
- Be empathetic and encouraging
- Don't use markdown formatting
- Share helpful nutrition guidance

Your supportive response:"""

            # Get response from LLM
            response = self.llm.invoke(prompt)
            
            return {
                "output": response,
                "agent_type": "diet_agent_simplified",
                "user_context_used": True
            }
            
        except Exception as e:
            print(f"Error in diet agent: {e}")
            # Fallback response
            return {
                "output": "I apologize, but I'm having trouble processing your nutrition question. Please try rephrasing your question or ask about specific dietary concerns.",
                "agent_type": "diet_agent_simplified",
                "error": True
            }

