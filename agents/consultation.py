import os
from dotenv import load_dotenv
from langchain_ibm import WatsonxLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain.prompts import PromptTemplate
from ibm_watson_machine_learning.metanames import GenTextParamsMetaNames as GenParams

load_dotenv()

url = os.getenv("URL")
apikey = os.getenv("API_KEY")
project_id = os.getenv("PROJECT_ID")

# Initialize the LLM
llm = WatsonxLLM(
    model_id="ibm/granite-3-8b-instruct",
    url=url,
    apikey=apikey,
    project_id=project_id,
    params={
        GenParams.DECODING_METHOD: "greedy",
        GenParams.TEMPERATURE: 0.1,
        GenParams.MIN_NEW_TOKENS: 10,
        GenParams.MAX_NEW_TOKENS: 200,
        GenParams.STOP_SEQUENCES: [
            "Human:", 
            "Observation", 
            "Question:",
            "USER:",
            "ASSISTANT:",
            "User previously asked:",
            "You previously responded:",
            "Consult",
            "consult",
            "healthcare provider",
            "medical professional",
            "doctor"
        ],
    },
)


class ConsultationAgent:
    def __init__(self, llm):
        self.llm = llm
        print("Consultation Agent Initialized")
    
    def _clean_response_and_add_followup(self, response, user_query):
        """Clean medical disclaimers and remove unwanted prefixes"""
        import re
        
        # Remove "Bloom:" prefix and similar patterns at the start
        cleaned_response = re.sub(r'^(Bloom:|bloom:)\s*["\']?', '', response.strip(), flags=re.IGNORECASE)
        
        # Remove trailing quotes if they exist
        cleaned_response = re.sub(r'["\']$', '', cleaned_response)
        
        # Remove common medical disclaimer patterns
        disclaimer_patterns = [
            r"consult.*?healthcare.*?provider.*?\.?",
            r"consult.*?doctor.*?\.?",
            r"seek.*?medical.*?advice.*?\.?",
            r"please.*?consult.*?\.?",
            r"consult.*?professional.*?\.?",
            r"healthcare.*?provider.*?\.?"
        ]
        
        for pattern in disclaimer_patterns:
            cleaned_response = re.sub(pattern, "", cleaned_response, flags=re.IGNORECASE)
        
        # Clean up extra spaces and periods
        cleaned_response = re.sub(r'\s+', ' ', cleaned_response)
        cleaned_response = re.sub(r'\.+', '.', cleaned_response)
        cleaned_response = cleaned_response.strip()
        
        # Only add follow-up if response is very short or incomplete
        if len(cleaned_response) < 30 and not cleaned_response.endswith('?'):
            follow_up = "What would you like to know more about?"
            if cleaned_response and not cleaned_response.endswith('.'):
                cleaned_response += ". "
            cleaned_response += follow_up
        
        return cleaned_response
    
    def run(self, user_query, user_profile=None, user_logs=None, conversation_context=None, is_first_query=False):
        """Run the consultation agent with user context"""
        
        # Format user context
        profile_text = str(user_profile) if user_profile else "No user profile available"
        logs_text = str(user_logs) if user_logs else "No previous interaction history"
        context_text = conversation_context or "No previous conversation history"
        
        # Simplified prompt
        prompt = f"""You are Bloom, a compassionate menopause wellness companion who helps women understand their experiences.

USER PROFILE: {profile_text}
USER SYMPTOMS: {logs_text}
CONVERSATION HISTORY: {context_text}

USER'S QUESTION: "{user_query}"

RESPONSE REQUIREMENTS:
- Share practical wellness strategies and lifestyle approaches
- Suggest specific remedies, self-care practices, or symptom management techniques
- Be warm, understanding, and supportive
- Give complete, helpful information
- Keep response under 80 words
- Avoid medical disclaimers or referral language
- Focus on actionable advice and reassurance

Your supportive response:"""
        
        # Get response from LLM
        try:
            response = self.llm.invoke(prompt)
            
            # Clean response and ensure follow-up question
            cleaned_response = self._clean_response_and_add_followup(response, user_query)
            
            return {
                "output": cleaned_response,
                "agent_type": "consultation",
                "user_context_used": True
            }
        except Exception as e:
            return {
                "output": f"I'd love to help you with that. Can you tell me more about what you're experiencing specifically?",
                "agent_type": "consultation",
                "error": True
            }


# Initialize the LLM
if __name__ == "__main__":
    # Create the agent
    agent = ConsultationAgent(llm)
    
    # Test data
    test_profile = {
        "age": 52,
        "menopause_stage": "perimenopause",
        "current_symptoms": ["hot flashes", "night sweats", "irregular periods"],
        "health_conditions": ["high blood pressure", "family history of breast cancer"],
        "current_medications": ["blood pressure medication"],
        "previous_treatments": ["tried herbal supplements"]
    }
    
    test_logs = [
        {"query": "What are the stages of menopause?", "timestamp": "2025-08-10"},
        {"query": "Are there risks with hormone therapy?", "timestamp": "2025-08-12"}
    ]

    # Test the agent
    response = agent.run(
        user_query='I am experiencing hot flashes and night sweats. What could be causing this and what can I do about it?',
        user_profile=test_profile,
        user_logs=test_logs,
        conversation_context="No previous conversation history.",
        is_first_query=True
    )
    print(response)