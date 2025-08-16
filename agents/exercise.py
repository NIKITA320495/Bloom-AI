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
        GenParams.MAX_NEW_TOKENS: 150,
        GenParams.STOP_SEQUENCES: [
            "Human:", 
            "Observation", 
            "Question:",
            "USER:",
            "ASSISTANT:",
            "User previously asked:",
            "You previously responded:"
        ],
    },
)


class ExerciseAgent:
    def __init__(self, llm):
        self.llm = llm
        print("Exercise Agent Initialized")
    
    def run(self, user_query, user_profile=None, user_logs=None, conversation_context=None, is_first_query=False):
        """Run the exercise agent with user context"""
        
        # Format user context
        profile_text = str(user_profile) if user_profile else "No user profile available"
        logs_text = str(user_logs) if user_logs else "No previous interaction history"
        context_text = conversation_context or "No previous conversation history"
        
        # Simplified prompt
        prompt = f"""You are Bloom, a supportive fitness and wellness guide specializing in menopause health.

USER PROFILE: {profile_text}
USER SYMPTOMS: {logs_text}
CONVERSATION HISTORY: {context_text}

USER'S QUESTION: "{user_query}"

INSTRUCTIONS:
- Provide practical, encouraging exercise advice for menopause wellness
- Suggest specific exercises, routines, and movement strategies
- Focus on strength, flexibility, cardiovascular health, and bone density
- Be supportive and motivational
- Use conversation history for context but don't repeat it
- Keep response under 70 words
- Don't use markdown formatting
- Share actionable fitness guidance

Your encouraging response:"""
        
        # Get response from LLM
        try:
            response = self.llm.invoke(prompt)
            return {
                "output": response,
                "agent_type": "exercise",
                "user_context_used": True
            }
        except Exception as e:
            return {
                "output": f"I apologize, but I'm having trouble processing your exercise question. Please try rephrasing your question or be more specific about your fitness goals.",
                "agent_type": "exercise",
                "error": True
            }


# Initialize the LLM
if __name__ == "__main__":
    # Create the agent
    agent = ExerciseAgent(llm)
    
    # Test data
    test_profile = {
        "age": 52,
        "menopause_stage": "perimenopause",
        "current_symptoms": ["hot flashes", "sleep disturbances", "mood swings"],
        "fitness_level": "beginner",
        "health_conditions": ["high blood pressure"],
        "exercise_preferences": ["walking", "swimming"]
    }
    
    test_logs = [
        {"query": "What exercises are safe for menopause?", "timestamp": "2025-08-10"},
        {"query": "How can I manage weight gain during menopause?", "timestamp": "2025-08-12"}
    ]

    # Test the agent
    response = agent.run(
        user_query='I want to start strength training but I have never done it before. What should I do?',
        user_profile=test_profile,
        user_logs=test_logs,
        conversation_context="No previous conversation history.",
        is_first_query=True
    )
    print(response)