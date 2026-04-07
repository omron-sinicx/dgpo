#!/bin/bash

WAND_PROJECT=DGPO

# Default values
DEFAULT_DATA_NAME="nq_hotpotqa_train"
DEFAULT_CUDA_DEVICES="0,1,2,3,4,5,6,7"
DEFAULT_MODEL="omron-sinicx/DGPO-qwen2.5-0.5b"
DEFAULT_EXPERIMENT_NAME="dgpo-test"

# Initialize variables with defaults
DATA_NAME="$DEFAULT_DATA_NAME"
CUDA_DEVICES="$DEFAULT_CUDA_DEVICES"
MODEL="$DEFAULT_MODEL"
EXPERIMENT_NAME="$DEFAULT_EXPERIMENT_NAME"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --data-name)
            DATA_NAME="$2"
            shift 2
            ;;
        --gpu-ids)
            CUDA_DEVICES="$2"
            shift 2
            ;;
        --model)
            MODEL="$2"
            shift 2
            ;;
        --experiment-name)
            EXPERIMENT_NAME="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --data-name <name>              Data name (default: $DEFAULT_DATA_NAME)"
            echo "  --gpu-ids <devices>             CUDA visible devices (default: $DEFAULT_CUDA_DEVICES)"
            echo "  --model <model>                 Model path to evaluate (default: $DEFAULT_MODEL)"
            echo "  --experiment-name <name>        Experiment name (default: $DEFAULT_EXPERIMENT_NAME)"
            echo "  --help, -h                      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Export environment variables
export CUDA_VISIBLE_DEVICES="$CUDA_DEVICES"
export MODEL="$MODEL"
export EXPERIMENT_NAME="$EXPERIMENT_NAME"
export DATA_DIR="${DATA_ROOT}/${DATA_NAME}"
export VLLM_ATTENTION_BACKEND=XFORMERS

# Create necessary directories
mkdir -p ${EXP_ROOT}/logs
mkdir -p ${EXP_ROOT}/verl_checkpoints/$EXPERIMENT_NAME

PYTHONUNBUFFERED=1 python3 -m verl.trainer.main_ppo \
    data.train_files=$DATA_DIR/train.parquet \
    data.val_files=$DATA_DIR/test.parquet \
    data.train_data_num=null \
    data.val_data_num=null \
    data.train_batch_size=512 \
    data.val_batch_size=256 \
    data.max_prompt_length=4096 \
    data.max_response_length=500 \
    data.max_start_length=2048 \
    data.max_obs_length=500 \
    data.shuffle_train_dataloader=True \
    algorithm.adv_estimator=gae \
    actor_rollout_ref.model.path=$MODEL \
    actor_rollout_ref.model.ref_path=$MODEL \
    actor_rollout_ref.actor.optim.lr=1e-6 \
    actor_rollout_ref.model.enable_gradient_checkpointing=true \
    actor_rollout_ref.model.use_remove_padding=True \
    actor_rollout_ref.actor.optim.lr_warmup_steps_ratio=0.285 \
    actor_rollout_ref.actor.ppo_mini_batch_size=256 \
    actor_rollout_ref.actor.ppo_micro_batch_size=128 \
    actor_rollout_ref.actor.fsdp_config.param_offload=true \
    actor_rollout_ref.actor.fsdp_config.grad_offload=true \
    actor_rollout_ref.actor.fsdp_config.optimizer_offload=true \
    actor_rollout_ref.rollout.log_prob_micro_batch_size=128 \
    actor_rollout_ref.rollout.tensor_model_parallel_size=1 \
    actor_rollout_ref.rollout.name=vllm \
    actor_rollout_ref.rollout.gpu_memory_utilization=0.8 \
    actor_rollout_ref.ref.log_prob_micro_batch_size=128 \
    actor_rollout_ref.ref.fsdp_config.param_offload=True \
    actor_rollout_ref.rollout.n_agent=1 \
    actor_rollout_ref.rollout.temperature=1 \
    actor_rollout_ref.rollout.top_p=1.0 \
    actor_rollout_ref.actor.state_masking=true \
    actor_rollout_ref.actor.use_kl_loss=false \
    actor_rollout_ref.actor.kl_loss_type=kl \
    critic.optim.lr=1e-5 \
    critic.model.use_remove_padding=True \
    critic.optim.lr_warmup_steps_ratio=0.015 \
    critic.model.path=$MODEL \
    critic.model.enable_gradient_checkpointing=true \
    critic.ppo_micro_batch_size=64 \
    critic.model.fsdp_config.param_offload=true \
    critic.model.fsdp_config.grad_offload=true \
    critic.model.fsdp_config.optimizer_offload=true \
    algorithm.kl_ctrl.kl_coef=0.001 \
    algorithm.kl_penalty=kl \
    algorithm.no_think_rl=false \
    trainer.critic_warmup=0 \
    trainer.logger=['wandb'] \
    +trainer.val_only=true \
    +trainer.val_before_train=true \
    trainer.default_hdfs_dir=null \
    trainer.n_gpus_per_node=8 \
    trainer.nnodes=1 \
    trainer.save_freq=50 \
    trainer.test_freq=200 \
    trainer.project_name=$WAND_PROJECT \
    trainer.experiment_name=$EXPERIMENT_NAME \
    trainer.total_epochs=15 \
    trainer.total_training_steps=1005 \
    trainer.default_hdfs_dir=null \
    trainer.default_local_dir=${EXP_ROOT}/verl_checkpoints/$EXPERIMENT_NAME \
    max_turns=4 \
    retriever.url="http://127.0.0.1:8000/retrieve" \
    retriever.topk=3 \
    2>&1 | tee ${EXP_ROOT}/logs/$EXPERIMENT_NAME.log
