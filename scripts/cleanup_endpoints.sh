#!/bin/bash

# Delete duplicate Vertex AI endpoints
# Keep only: 607386715857879040

PROJECT_ID="mannmitra-mental-health"
REGION="us-central1"

echo "🗑️  Deleting duplicate AI Companion Pro endpoints..."
echo "Keeping endpoint: 607386715857879040"
echo ""

# List of endpoint IDs to delete
ENDPOINTS_TO_DELETE=(
    "5964981422568505344"
    "8152604941563723776"
    "2465684512101629952"
    "1330777406004264960"
    "721665556402405376"
    "3645627614472699904"
    "6113600210271731712"
    "1353295404141117440"
    "7095384929038499840"
)

# Delete each endpoint
for ENDPOINT_ID in "${ENDPOINTS_TO_DELETE[@]}"; do
    echo "Deleting endpoint: $ENDPOINT_ID"
    gcloud ai endpoints delete $ENDPOINT_ID \
        --project=$PROJECT_ID \
        --region=$REGION \
        --quiet
    
    if [ $? -eq 0 ]; then
        echo "✅ Deleted: $ENDPOINT_ID"
    else
        echo "❌ Failed to delete: $ENDPOINT_ID"
    fi
    echo ""
done

echo "✨ Cleanup complete!"
echo ""
echo "Remaining endpoint:"
gcloud ai endpoints list \
    --project=$PROJECT_ID \
    --region=$REGION \
    --filter="displayName:AI-Companion-Pro"
