<div align="center">
<h1>DGPO: Distillation-Guided Policy Optimization for Preserving Agentic RAG Capabilities</h1>

<p align="center">
    Rikuto Kotoge<sup>1</sup> &nbsp;
    Mai Nishimura<sup>2</sup> &nbsp;
    Jiaxin Ma<sup>2</sup>
</p>

<p align="center">
    <sup>1</sup>Osaka University &nbsp;
    <sup>2</sup>OMRON SINIC X Corporation
</p>

<p align="center">
    <a href="https://arxiv.org/abs/2508.20324"><img src="https://img.shields.io/badge/arXiv-2508.20324-orange" alt="arXiv"></a>
    <a href="https://omron-sinicx.github.io/dgpo/"><img src="https://img.shields.io/badge/Project-Page-blue" alt="Project Page"></a>
    <a href="https://huggingface.co/collections/omron-sinicx/dgpo"><img src="https://img.shields.io/badge/-HuggingFace-3B4252?style=flat&logo=huggingface&logoColor=" alt="HuggingFace"></a>
    <a href="https://opensource.org/licenses/Apache-2.0"><img src="https://img.shields.io/badge/License-Apache%202.0-green.svg" alt="License"></a>
    <a href="https://pixi.prefix.dev/latest/"><img src="https://img.shields.io/badge/🪄%20Pixi-v0.66.0-yellow" alt="Pixi"></a>
</p>

</div>

---

## 📄 Abstract
Reinforcement Learning has emerged as a post-training approach to elicit agentic RAG behaviors such as search and planning from language models.
However, compact language models (e.g., 0.5B parameters) struggle due to poor reasoning ability, resulting in sparse rewards and unstable training.
To overcome these difficulties, we propose Distillation-Guided Policy Optimization (DGPO), which addresses the challenges through cold-start initialization from teacher demonstrations and continuous teacher guidance during policy optimization.
To systematically evaluate our approach, we introduce Agentic RAG Capabilities (ARCap), a fine-grained metric analyzing reasoning, search coordination, and response synthesis.
Comprehensive experiments demonstrate that DGPO enables compact models to achieve sophisticated agentic search behaviors, even outperforming the larger teacher model in some cases. DGPO significantly makes agentic RAG feasible in computing resource-constrained environments.

## 🛠️ Installation
Install Pixi following the [official instruction](https://pixi.prefix.dev/latest/)

```sh
curl -fsSL https://pixi.sh/install.sh | sh
```

Clone the repository and install dependencies:

```bash
git clone https://github.com/omron-sinicx/dgpo.git
cd dgpo
pixi install -a
```

> All dependencies are installed in the project-root directory (`.pixi/`). No global or system-wide packages are modified.

## 🚀 Available Tasks

List available tasks with `pixi task list`. Each task runs in its associated virtual environment (see `pyproject.toml`).

```
Task              Description
download          Download corpus and dataset
download-corpus   Download indexing and corpus (133.66GB)
download-dataset  Download NQ/HotpotQA training data
format-toml       Format TOML files with tombi
login-hf          Login to Hugging Face
login-wandb       Login to W&B
start             Start retrieval server
test              Test pretrained models
train             Train model w/ DGPO
```

## ⚙️ Configuration

Before running any commands, set the following paths in the `[tool.pixi.activation.env]` section of `pyproject.toml`:

| Variable | Description |
|---|---|
| 📁 `RETRIEVER_DATA_PATH` | Directory for retrieval index & corpus (133.66 GB) |
| 🧪 `EXP_ROOT` | Root directory for experiment checkpoints and logs |
| 📊 `DATA_ROOT` | Directory for training dataset (default: `./data`) |

```toml
[tool.pixi.activation.env]
RETRIEVER_DATA_PATH = "/path/to/retriever"  # e5_Flat.index + wiki-18.jsonl
EXP_ROOT = "/path/to/experiments"
DATA_ROOT = "./data"
```

## 📦 Dataset Preparation

Log in to Hugging Face, then download all required data (133.66 GB total):

```bash
pixi run login-hf  # for huggingface authorization
pixi run download  # downloads corpus + training dataset
```

> To download individually:
> - `pixi run download-corpus` — retrieval index & corpus
> - `pixi run download-dataset` — training dataset

## 🧠 Training

Train a compact agentic LLM.

Teacher model (3B) was trained using the [Search-R1 repository](https://github.com/PeterGriffinJin/Search-R1).
Cold start initialization can be applied to any knowledge distillation method. We used the standard forward kld based method implementation provided in the [TAID repository](https://github.com/SakanaAI/TAID).

(1) Launch a local retrieval server.
```bash
pixi run start
```

(2) Run DGPO
```bash
pixi run login-wandb # for wandb authorization
pixi run train
pixi run train {data_name} {student} {teacher} {exp_name}
```

## 🔍 Inference
#### You can play with the trained model with your own question.
(1) Launch a local retrieval server.
```bash
pixi run start
```

(2) Run inference.
```bash
pixi run test {data_name} {model} {exp_name}
```
You can modify the ```question``` on line 7 and  the ```model``` on line 10  to something you're interested in.


## :octocat: Acknowledgement

Implementation is built upon [Search-R1](https://github.com/PeterGriffinJin/Search-R1), [veRL](https://github.com/volcengine/verl), and [RAGEN](https://github.com/ZihanWang314/RAGEN/tree/main).
We sincerely appreciate the efforts for their contributions to open-source research and development.

This work was supported by JST AIP Acceleration Research `JPMJCR23U2` and JST PRESTO, Japan, Grant Number `JPMJPR2518`.

## 📝 Citation

```bibtex
@inproceedings{kotoge2025dgpo,
    title = "Can Compact Language Models Search Like Agents? Distillation-Guided Policy Optimization for Preserving Agentic RAG Capabilities",
    author = "Kotoge, Rikuto and Nishimura, Mai and Ma, Jiaxin",
    booktitle = "Proceedings of the 64th Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)",
    month = jul,
    year = "2026",
    publisher = "Association for Computational Linguistics",
}

@inproceedings{kotoge2025democratizing,
    title = "Democratizing Agentic {RAG}: Distillation-Guided Policy Optimization for Compact Language Models",
    author = "Kotoge, Rikuto and Nishimura, Mai and Ma, Jiaxin",
    booktitle = "NeurIPS 2025 Workshop on Bridging Language, Agent, and World Models for Reasoning and Planning",
    year = "2025",
    url = "https://openreview.net/forum?id=CP0H9NAWES",
}
```
