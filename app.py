from flask import Flask, render_template
from flask import abort
import extensions
import config




# Initialize Flask app with the template folder address
app = Flask(__name__, template_folder='templates')

# Register the controllers


# Listen on external IPs
# For us, listen to port 3000 so you can just run 'python app.py' to start the server

@app.route('/')
def main_page():
	return render_template('userlist.html')

if __name__ == '__main__':
    # listen on external IPs
    app.run(host=config.env['host'], port=config.env['port'], debug=True)
