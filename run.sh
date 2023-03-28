#!/bin/bash

# cp -R /usr/local/lib/python3.10/site-packages/* ./.site-packages
# pip install -r requirements.txt

export BASE_URL=decapoda-research/llama-7b-hf
export FINETUNED_CKPT_URL=tloen/alpaca-lora-7b

python app.py --base_url $BASE_URL --ft_ckpt_url $FINETUNED_CKPT_URL --port 6006
