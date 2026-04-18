import boto3
from botocore.exceptions import ClientError
from app.config import get_settings

s = get_settings()
client = boto3.client('bedrock-runtime', region_name=s.aws_region, aws_access_key_id=s.aws_access_key_id, aws_secret_access_key=s.aws_secret_access_key)

for model_id in ['amazon.nova-lite-v1:0', 'amazon.nova-micro-v1:0']:
    try:
        response = client.converse(
            modelId=model_id,
            messages=[{'role':'user','content':[{'text':'Hello'}]}],
        )
        print(f'[OK] {model_id} works')
    except ClientError as e:
        print(f"[FAIL] {model_id} - {e.response['Error']['Code']}: {e.response['Error']['Message']}")
