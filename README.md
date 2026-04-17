Quick Start: Local Backend Setup
1. Local setup
Start at the project root ScamApp/ and run npm install

To spin up local environment demo, run npx expo start, press w for localhost in the browser

2. AWS Configuration
You need credentials to run the AI (Bedrock) and Voice (Polly) locally.

2.1. Install the AWS CLI:
# 1. Download the installer
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# 2. Unzip it (if you don't have unzip, run 'sudo apt install unzip' first)
unzip awscliv2.zip

# 3. Run the install script
sudo ./aws/install

2.2. Run aws configure in your terminal.

Enter the Access Key and Secret from our team chat.

Region: us-east-1

Location: just hit enter

3. Install & Run
Run these commands in the lambda/ folder if you want to start doing python testing:

# Set up the environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

3. Where are the Logs?
Since we are running locally, you don't need to check CloudWatch. All logs appear directly in your terminal window.

⚠️ Security Reminder
Do not paste the AWS keys into the README or any file in this repo. If you accidentally paste them into a chat or commit them, tell the team immediately so we can rotate them (AWS will detect them and shut them down).