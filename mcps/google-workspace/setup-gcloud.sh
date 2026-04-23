#!/bin/bash
#
# Google Workspace MCP - Fully Automated Setup via gcloud
# Creates project, enables APIs (Docs, Sheets, Drive, Calendar), and sets up OAuth
#

set -e

echo "============================================================"
echo "  Google Workspace MCP - Automated Setup via gcloud"
echo "============================================================"
echo ""

# Use gcloud directly (ensure it's on your PATH)
GCLOUD="gcloud"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Small helper for defaulted yes/no prompts.
prompt_yes_no() {
    local prompt="$1"
    local default="${2:-Y}"
    local reply

    if [ "$default" = "Y" ]; then
        read -p "$prompt [Y/n]: " reply
        reply="${reply:-Y}"
    else
        read -p "$prompt [y/N]: " reply
        reply="${reply:-N}"
    fi

    case "$reply" in
        Y|y|yes|YES) return 0 ;;
        *) return 1 ;;
    esac
}

# Check if gcloud is authenticated
echo "🔐 Checking gcloud authentication..."
$GCLOUD auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "   Not authenticated. Opening browser..."
    $GCLOUD auth login
    if [ $? -ne 0 ]; then
        echo "❌ Authentication failed"
        exit 1
    fi
fi

echo "✅ Authenticated"
echo ""

PROJECT_NAME="MCP Google Workspace"

echo "📦 Step 1: Creating Google Cloud Project"
echo ""

# Reuse the active gcloud project by default to avoid accidental project sprawl.
CURRENT_PROJECT="$($GCLOUD config get-value project 2>/dev/null || true)"
if [ "$CURRENT_PROJECT" = "(unset)" ]; then
    CURRENT_PROJECT=""
fi

if [ -n "$CURRENT_PROJECT" ] && prompt_yes_no "Reuse current gcloud project '$CURRENT_PROJECT'?" "Y"; then
    PROJECT_ID="$CURRENT_PROJECT"
else
    read -p "Enter an existing project ID, or press ENTER to create a new one: " EXISTING_PROJECT

    if [ -n "$EXISTING_PROJECT" ]; then
        PROJECT_ID=$EXISTING_PROJECT
        $GCLOUD config set project $PROJECT_ID
    else
        # Generate unique project ID (can't contain "google")
        PROJECT_ID="mcp-workspace-$(date +%s)"
        echo "   Project ID: $PROJECT_ID"

        # Create project; capture stderr to detect TOS failure specifically.
        CREATE_STDERR="$(mktemp)"
        if ! $GCLOUD projects create $PROJECT_ID --name="$PROJECT_NAME" --set-as-default 2>"$CREATE_STDERR"; then
            CREATE_ERROR="$(<"$CREATE_STDERR")"
            rm -f "$CREATE_STDERR"
            echo ""
            if [[ "$CREATE_ERROR" == *"Callers must accept Terms of Service"* ]]; then
                echo "⚠️  Google Cloud Terms of Service have not been accepted."
                echo "   Open https://console.cloud.google.com/ , accept the TOS,"
                echo "   then rerun this script or provide an existing project ID below."
            else
                echo "⚠️  Project creation failed. You might need:"
                echo "   1. Billing account set up"
                echo "   2. Project creation permissions"
                if [ -n "$CREATE_ERROR" ]; then
                    echo ""
                    echo "$CREATE_ERROR"
                fi
            fi
            echo ""
            echo "Alternatively, enter an existing project ID:"
            read -p "Project ID (or press Enter to exit): " EXISTING_PROJECT

            if [ -z "$EXISTING_PROJECT" ]; then
                echo "Setup cancelled."
                exit 1
            fi

            PROJECT_ID=$EXISTING_PROJECT
            $GCLOUD config set project $PROJECT_ID
        else
            rm -f "$CREATE_STDERR"
        fi
    fi
fi

echo "✅ Using project: $PROJECT_ID"
echo ""

echo "🔌 Step 2: Enabling Required APIs"
echo ""

# Enable required APIs
APIS=(
    "docs.googleapis.com"
    "sheets.googleapis.com"
    "drive.googleapis.com"
    "calendar-json.googleapis.com"
    "gmail.googleapis.com"
)

for API in "${APIS[@]}"; do
    echo "   Enabling $API..."
    $GCLOUD services enable $API --project=$PROJECT_ID
done

echo "✅ APIs enabled"
echo ""

echo "🔐 Step 3: Setting up OAuth"
echo ""

# Reuse downloaded OAuth client credentials when they already exist locally.
if [ -f "$SCRIPT_DIR/credentials.json" ] && prompt_yes_no "Reuse existing credentials.json?" "Y"; then
    echo "✅ Reusing existing credentials: $SCRIPT_DIR/credentials.json"
    echo ""
else
    # We need to create OAuth consent screen first
    echo "⚠️  OAuth consent screen must be configured via web console (one-time)"
    echo "   Opening browser..."
    echo ""

    open "https://console.cloud.google.com/apis/credentials/consent?project=${PROJECT_ID}"

    echo "Please complete these steps in the browser:"
    echo "  1. Choose 'External' user type"
    echo "  2. Fill in app name: 'MCP Google Workspace'"
    echo "  3. Add your email as test user"
    echo "  4. Save and continue through all steps"
    echo ""
    read -p "Press ENTER when consent screen is configured..."

    echo ""
    echo "Creating OAuth 2.0 Client ID..."
    echo ""

    # Create OAuth client
    # Note: gcloud doesn't directly support creating OAuth clients, 
    # so we'll guide the user to create it
    echo "⚠️  Creating OAuth client via gcloud is limited."
    echo "   Opening credentials page..."
    echo ""

    open "https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}"

    echo "Please create OAuth 2.0 Client ID:"
    echo "  1. Click '+ CREATE CREDENTIALS' → 'OAuth client ID'"
    echo "  2. Application type: 'Desktop app'"
    echo "  3. Name: 'MCP Google Workspace Client'"
    echo "  4. Click 'CREATE'"
    echo "  5. Download the JSON file"
    echo ""
    read -p "Press ENTER when you've downloaded the credentials..."

    echo ""
    echo "📥 Step 4: Installing Credentials"
    echo ""

    # Find the most recent credentials file
    DOWNLOADS="$HOME/Downloads"
    CRED_FILE=$(find "$DOWNLOADS" -name "client_secret_*.json" -type f -print0 2>/dev/null | xargs -0 ls -t | head -n 1)

    if [ -z "$CRED_FILE" ]; then
        echo "⚠️  Could not find credentials file in Downloads"
        read -p "Enter path to credentials JSON file: " CRED_FILE
    fi

    if [ ! -f "$CRED_FILE" ]; then
        echo "❌ File not found: $CRED_FILE"
        exit 1
    fi

    # Copy to MCP directory
    cp "$CRED_FILE" "$SCRIPT_DIR/credentials.json"

    echo "✅ Credentials installed: $SCRIPT_DIR/credentials.json"
    echo ""
fi

# Build before auth so dist/auth.js exists for the inline Node step below.
cd "$SCRIPT_DIR"
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    npm install
fi
npm run build

echo "🔓 Step 5: Authenticating"
echo ""

# Authenticate using the credentials
cd "$SCRIPT_DIR"
echo "This will open your browser for authorization..."
echo ""

# Dropping the saved token forces a fresh OAuth grant when scopes need to change.
if [ -f "$SCRIPT_DIR/token.json" ] && prompt_yes_no "Re-authenticate and overwrite the saved token?" "Y"; then
    rm -f "$SCRIPT_DIR/token.json"
fi

# Run a quick Node.js script to do OAuth
node --input-type=module << 'EOF'
import './dist/polyfill.js';
const { authorize } = await import('./dist/auth.js');

console.log('Starting OAuth flow...\n');

try {
  await authorize();
  console.log('\n✅ Authentication successful!');
  console.log('Token saved. You\'re all set!');
  process.exit(0);
} catch (err) {
  console.error('\n❌ Authentication failed:', err.message);
  process.exit(1);
}
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================"
    echo "  ✅ Setup Complete!"
    echo "============================================================"
    echo ""
    echo "Your Google Workspace MCP is now configured!"
    echo ""
    echo "Project: $PROJECT_ID"
    echo "Credentials: $SCRIPT_DIR/credentials.json"
    echo "Token: $SCRIPT_DIR/token.json"
    echo ""
    echo "Next steps:"
    echo "  1. Restart Cursor"
    echo "  2. Try: 'List my Google Docs' or 'List my calendar events'"
    echo ""
else
    echo ""
    echo "❌ Setup failed during authentication"
    exit 1
fi
