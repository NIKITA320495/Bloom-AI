from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import sys
from dotenv import load_dotenv
from langchain_ibm import WatsonxLLM
from ibm_watson_machine_learning.metanames import GenTextParamsMetaNames as GenParams

# Add the agents directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'agents'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'whatsapp_connection'))

from agents.orchestrator import Orchestrator
from whatsapp_connection import WhatsAppBot

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS for all domains on all routes
CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])

# Initialize Watson LLM
url = os.getenv("URL")
apikey = os.getenv("API_KEY")
project_id = os.getenv("PROJECT_ID")

llm = WatsonxLLM(
    model_id="ibm/granite-3-8b-instruct",
    url=url,
    apikey=apikey,
    project_id=project_id,
    params={
        GenParams.DECODING_METHOD: "greedy",
        GenParams.TEMPERATURE: 0.3,  # Lower temperature for more focused responses
        GenParams.MIN_NEW_TOKENS: 10,
        GenParams.MAX_NEW_TOKENS: 150,
        GenParams.STOP_SEQUENCES: [
            "Human:", 
            "Observation",
            "USER QUESTION:",
            "ASSISTANT:",
            "User:",
            "Assistant:"
        ],
    },
)

# Initialize orchestrator
orchestrator = Orchestrator(llm)

# Initialize WhatsApp bot (now with its own WhatsApp orchestrator)
whatsapp_bot = WhatsAppBot()

@app.route('/')
def home():
    """Render the main page with a query input form"""
    return render_template('index.html')



@app.route('/chat', methods=['POST'])
def chat():
    """Process user query through orchestrator for intelligent routing"""       
    try:
        data = request.get_json()
        # ... (your validation logic for user_id and query is correct)
        if not data or 'query' not in data or 'user_id' not in data:
            return jsonify({'error': 'Request must include "query" and "user_id"'}), 400
        
        user_query = data['query'].strip()
        user_id = data['user_id'].strip()

        if not user_query or not user_id:
            return jsonify({'error': 'Empty query or user_id provided'}), 400
        
        print(f"Processing orchestration for user '{user_id}': {user_query}")
        result = orchestrator.run_categorization_pipeline(user_query, user_id)
        print(f"Orchestrator result: {result}")

        if isinstance(result, dict) and 'output' in result:
            response_text = result['output']
        else:
            response_text = str(result)
        
        return jsonify({
            'user_id': user_id,
            'query': user_query,
            'response': response_text,
            'status': 'success'
        })
        
    except Exception as e:
        print(f"Error processing chat query: {str(e)}")
        return jsonify({
            'error': f'Server error: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/basicquery', methods=['POST'])
def basicquery():
    """
    Processes a basic query directly, bypassing categorization.
    """
    try:
        data = request.get_json()
        # ... (your validation logic for user_id and query is correct)
        if not data or 'query' not in data or 'user_id' not in data:
            return jsonify({'error': 'Request must include "query" and "user_id"'}), 400
        
        user_query = data['query'].strip()
        user_id = data['user_id'].strip()

        if not user_query or not user_id:
            return jsonify({'error': 'Empty query or user_id provided'}), 400
        
        print(f"Processing dedicated basic query for user '{user_id}': {user_query}")
        
        # --- KEY CHANGE ---
        # Call the new dedicated method in the orchestrator
        result = orchestrator.run_basic_query_agent(user_query=user_query, user_id=user_id)
        
        print(f"Final agent result: {result}")
        
        response_text = str(result)
        
        return jsonify({
            'user_id': user_id,
            'query': user_query,
            'response': response_text,
            'category': 'BASIC_QUERY', # Always correct for this endpoint
            'status': 'success'
        })
        
    except Exception as e:
        print(f"Error processing basic query: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.'}), 500

        

@app.route('/consultation', methods=['POST'])
def consultation():
    """Process consultation-related queries directly through consultation agent"""
    try:
        # Get the query from request
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({
                'error': 'No query provided',
                'status': 'error'
            }), 400
        
        user_query = data['query'].strip()
        if not user_query:
            return jsonify({
                'error': 'Empty query provided',
                'status': 'error'
            }), 400
        
        print(f"Processing consultation query: {user_query}")
        
        # Process query directly through exercise agent
        result = orchestrator.consultation_agent.run(user_query)
        
        print(f"Consultation agent result: {result}")
        
        # Handle different result formats from agents
        if isinstance(result, dict) and 'output' in result:
            response_text = result['output']
        else:
            response_text = str(result)
        
        return jsonify({
            'query': user_query,
            'response': response_text,
            'category': 'CONSULTATION',
            'status': 'success'
        })
        
    except Exception as e:
        print(f"Error processing consultation query: {str(e)}")
        return jsonify({
            'error': f'Server error: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/exercise', methods=['POST'])
def exercise():
    """Process exercise-related queries directly through exercise agent"""
    try:
        # Get the query from request
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({
                'error': 'No query provided',
                'status': 'error'
            }), 400
        
        user_query = data['query'].strip()
        if not user_query:
            return jsonify({
                'error': 'Empty query provided',
                'status': 'error'
            }), 400
        
        print(f"Processing exercise query: {user_query}")
        
        # Process query directly through exercise agent
        result = orchestrator.exercise_agent.run(user_query)
        
        print(f"Exercise agent result: {result}")
        
        # Handle different result formats from agents
        if isinstance(result, dict) and 'output' in result:
            response_text = result['output']
        else:
            response_text = str(result)
        
        return jsonify({
            'query': user_query,
            'response': response_text,
            'category': 'EXERCISE',
            'status': 'success'
        })
        
    except Exception as e:
        print(f"Error processing exercise query: {str(e)}")
        return jsonify({
            'error': f'Server error: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/diet', methods=['POST'])
def diet():
    """Process diet-related queries directly through diet agent"""
    try:
        # Get the query from request
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({
                'error': 'No query provided',
                'status': 'error'
            }), 400
        
        user_query = data['query'].strip()
        if not user_query:
            return jsonify({
                'error': 'Empty query provided',
                'status': 'error'
            }), 400
        
        print(f"Processing diet query: {user_query}")
        
        # Process query directly through diet agent
        result = orchestrator.diet_agent.run(user_query)
        
        print(f"Diet agent result: {result}")
        
        # Handle different result formats from agents
        if isinstance(result, dict) and 'output' in result:
            response_text = result['output']
        else:
            response_text = str(result)
        
        return jsonify({
            'query': user_query,
            'response': response_text,
            'category': 'DIET',
            'status': 'success'
        })
        
    except Exception as e:
        print(f"Error processing diet query: {str(e)}")
        return jsonify({
            'error': f'Server error: {str(e)}',
            'status': 'error'
        }), 500

# @app.route('/health', methods=['GET'])
# def health_check():
#     """Health check endpoint"""
#     return jsonify({
#         'status': 'healthy',
#         'message': 'Menopause consultation API is running',
#         'available_endpoints': {
#             'chat': 'POST /chat - General queries routed through orchestrator',
#             'exercise': 'POST /exercise - Exercise-specific queries',
#             'diet': 'POST /diet - Diet-specific queries',
#             'whatsapp': 'POST /whatsapp - WhatsApp webhook for Twilio'
#         }
#     })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Bloom AI Backend is running successfully',
        'available_endpoints': {
            'chat': 'POST /chat - General queries routed through orchestrator',
            'basicquery': 'POST /basicquery - Basic queries',
            'consultation': 'POST /consultation - Consultation-specific queries',
            'exercise': 'POST /exercise - Exercise-specific queries',
            'diet': 'POST /diet - Diet-specific queries',
            'whatsapp': 'POST /whatsapp - WhatsApp webhook for Twilio',
            'health': 'GET /health - Health check'
        },
        'cors_enabled': True,
        'frontend_url': 'http://localhost:3000'
    })

@app.route('/whatsapp', methods=['POST'])
def whatsapp_webhook():
    """WhatsApp webhook endpoint for Twilio"""
    try:
        response = whatsapp_bot.process_whatsapp_message()
        return response, 200, {'Content-Type': 'text/xml'}
    except Exception as e:
        print(f"Error in WhatsApp webhook: {str(e)}")
        return "Error processing message", 500

@app.route('/whatsapp/send', methods=['POST'])
def send_whatsapp_message():
    """Endpoint to send WhatsApp messages programmatically"""
    try:
        data = request.get_json()
        if not data or 'to_number' not in data or 'message' not in data:
            return jsonify({
                'error': 'Missing required fields: to_number and message',
                'status': 'error'
            }), 400
        
        to_number = data['to_number']
        message = data['message']
        
        success = whatsapp_bot.send_whatsapp_message(to_number, message)
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'WhatsApp message sent successfully'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to send WhatsApp message'
            }), 500
            
    except Exception as e:
        print(f"Error sending WhatsApp message: {str(e)}")
        return jsonify({
            'error': f'Server error: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/whatsapp/register', methods=['POST'])
def register_user_profile():
    """Register user profile for personalized WhatsApp responses"""
    try:
        data = request.get_json()
        if not data or 'phone_number' not in data or 'profile' not in data:
            return jsonify({
                'error': 'Missing required fields: phone_number and profile',
                'status': 'error'
            }), 400
        
        phone_number = data['phone_number']
        profile_data = data['profile']
        
        success = whatsapp_bot.register_user_profile(phone_number, profile_data)
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'User profile registered successfully'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to register user profile'
            }), 500
            
    except Exception as e:
        print(f"Error registering user profile: {str(e)}")
        return jsonify({
            'error': f'Server error: {str(e)}',
            'status': 'error'
        }), 500

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    print("Starting Menopause Consultation API...")
    print("Available endpoints:")
    print("- GET  /           : Main page with query form")
    print("- POST /chat       : General queries (routed through orchestrator)")
    print("- POST /exercise   : Exercise-specific queries")
    print("- POST /basicquery       : Basic queries")
    print("- POST /consultation       : Consultation-specific queries")
    print("- POST /diet       : Diet-specific queries")
    print("- POST /whatsapp   : WhatsApp webhook for Twilio")
    print("- POST /whatsapp/send : Send WhatsApp message programmatically")
    print("- POST /whatsapp/register : Register user profile for WhatsApp")
    # print("- GET  /health     : Health check")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
