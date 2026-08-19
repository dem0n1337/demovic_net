"""
Self-hosted, OpenAI-compatible LLM endpoint on Modal — for the demovic.net
LLM-eval harness (see ../evals). vLLM serving an instruct model, API-key auth.

Deploy:   modal deploy modal_llm/serve.py
Test:     curl $URL/v1/models -H "Authorization: Bearer $KEY"

The API key is read at deploy time from modal_llm/.llm-key (gitignored). If the
file is absent it is generated and written there. The value is baked into an
inline Modal Secret, so it never lives in the repo.
"""

import secrets as _secrets
from pathlib import Path

import modal

# ---- model under test -------------------------------------------------------
# Ungated, strong instruct model — good both as the "support agent" under test
# and as the eval judge. Swap MODEL_NAME + redeploy to test a different model.
MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"
MODEL_REVISION = "main"
GPU = "L4"  # 24 GB — fits a 7B in fp16 with room for KV cache
MAX_MODEL_LEN = 8192

# ---- API key (deploy-time, gitignored) --------------------------------------
_KEY_FILE = Path(__file__).with_name(".llm-key")
if _KEY_FILE.exists():
    API_KEY = _KEY_FILE.read_text().strip()
else:
    API_KEY = "sk-demovic-" + _secrets.token_hex(24)
    _KEY_FILE.write_text(API_KEY + "\n")

# ---- image + caches ---------------------------------------------------------
vllm_image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "vllm==0.6.6.post1",
        "huggingface_hub[hf_transfer]==0.26.2",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1", "VLLM_USE_V1": "0"})
)

hf_cache = modal.Volume.from_name("demovic-hf-cache", create_if_missing=True)
vllm_cache = modal.Volume.from_name("demovic-vllm-cache", create_if_missing=True)

app = modal.App("demovic-llm")


@app.function(
    image=vllm_image,
    gpu=GPU,
    volumes={
        "/root/.cache/huggingface": hf_cache,
        "/root/.cache/vllm": vllm_cache,
    },
    secrets=[modal.Secret.from_dict({"VLLM_API_KEY": API_KEY})],
    scaledown_window=300,   # keep warm 5 min after last request
    timeout=60 * 60,
)
@modal.concurrent(max_inputs=32)
@modal.web_server(port=8000, startup_timeout=60 * 10)
def serve():
    import subprocess

    cmd = [
        "vllm", "serve", MODEL_NAME,
        "--revision", MODEL_REVISION,
        "--host", "0.0.0.0",
        "--port", "8000",
        "--api-key", API_KEY,
        "--max-model-len", str(MAX_MODEL_LEN),
        "--gpu-memory-utilization", "0.90",
        "--served-model-name", MODEL_NAME, "qwen2.5-7b-instruct",
    ]
    subprocess.Popen(" ".join(cmd), shell=True)


@app.local_entrypoint()
def main():
    print("API key (also in modal_llm/.llm-key):")
    print(" ", API_KEY)
