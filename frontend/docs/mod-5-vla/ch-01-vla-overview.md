---
sidebar_position: 2
title: VLA Overview
description: Introduction to Vision-Language-Action models for robotics
hardware_requirements: "GPU with 16GB+ VRAM for inference, 48GB+ for training"
resource_type: both
---

# VLA Overview

Vision-Language-Action (VLA) models represent the cutting edge of physical AI, unifying perception, language understanding, and physical action in a single architecture.

## What is VLA?

VLA models connect three modalities:

$$
f: (\mathcal{V}, \mathcal{L}) \rightarrow \mathcal{A}
$$

Where:
- $\mathcal{V}$ = Visual observations (images, point clouds)
- $\mathcal{L}$ = Language instructions (natural language commands)
- $\mathcal{A}$ = Actions (joint positions, end-effector poses)

```
┌─────────────────────────────────────────────────────────────┐
│                     VLA Architecture                         │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌─────────────────────┐   │
│  │  Vision  │    │ Language │    │   Action Decoder    │   │
│  │ Encoder  │    │ Encoder  │    │                     │   │
│  │  (ViT)   │    │  (LLM)   │    │  [a₁, a₂, ..., aₙ]  │   │
│  └────┬─────┘    └────┬─────┘    └──────────┬──────────┘   │
│       │               │                      │              │
│       └───────┬───────┘                      │              │
│               ▼                              │              │
│       ┌───────────────┐                      │              │
│       │   Multimodal  │──────────────────────┘              │
│       │   Transformer │                                     │
│       └───────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
```

## Why VLA Matters

Traditional robotics separates perception, planning, and control:

```
Old: Camera → CV Model → Planner → Controller → Robot
New: Camera + "Pick up the red cup" → VLA → Robot
```

VLA models enable:
- **Natural interaction**: Commands in plain English
- **Generalization**: Handle unseen objects/tasks
- **End-to-end learning**: No hand-crafted pipelines

## Key Architectures

### RT-2 (Robotics Transformer 2)

Google DeepMind's approach tokenizes actions:

```python
# Conceptual RT-2 architecture
class RT2:
    def __init__(self):
        self.vlm = PaLI_X()  # Vision-Language Model
        self.action_tokenizer = ActionTokenizer(
            bins=256,  # Discretize continuous actions
            num_actions=7  # 6 DOF + gripper
        )

    def forward(self, image, instruction):
        # VLM processes multimodal input
        tokens = self.vlm(image, instruction)

        # Decode action tokens
        action_tokens = tokens[-7:]  # Last 7 tokens = action
        actions = self.action_tokenizer.decode(action_tokens)

        return actions  # [x, y, z, rx, ry, rz, gripper]
```

### OpenVLA

Open-source VLA from Stanford/Berkeley:

```python
from transformers import AutoModelForVision2Seq, AutoProcessor

# Load OpenVLA
processor = AutoProcessor.from_pretrained("openvla/openvla-7b")
model = AutoModelForVision2Seq.from_pretrained("openvla/openvla-7b")

# Inference
inputs = processor(
    images=camera_image,
    text="pick up the red block",
    return_tensors="pt"
)

actions = model.generate(**inputs, max_new_tokens=7)
# Output: [dx, dy, dz, drx, dry, drz, gripper]
```

### PaLM-E

Google's embodied language model:

$$
P(a_t | s_{1:t}, l) = \text{Transformer}(\text{Embed}(s_{1:t}), \text{Embed}(l))
$$

Where $s_t$ includes both visual and proprioceptive state.

## Training VLA Models

### Data Collection

VLA models require demonstrations:

```python
# Demonstration data structure
demonstration = {
    "observations": {
        "image": np.array([...]),      # (H, W, 3)
        "depth": np.array([...]),       # (H, W)
        "proprioception": np.array([...])  # Joint positions
    },
    "instruction": "Pick up the red cup and place it on the plate",
    "actions": np.array([...]),        # (T, 7) trajectory
    "success": True
}
```

### Training Objective

The loss combines language modeling and action prediction:

$$
\mathcal{L} = \mathcal{L}_{\text{LM}} + \lambda \mathcal{L}_{\text{action}}
$$

```python
def vla_loss(model, batch):
    # Language modeling loss (next token prediction)
    lm_logits = model.get_lm_logits(batch)
    lm_loss = F.cross_entropy(lm_logits, batch["text_targets"])

    # Action prediction loss
    action_logits = model.get_action_logits(batch)
    action_loss = F.mse_loss(action_logits, batch["actions"])

    return lm_loss + 0.1 * action_loss
```

### Fine-tuning Strategy

```python
from peft import LoraConfig, get_peft_model

# LoRA for efficient fine-tuning
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.1,
)

model = get_peft_model(base_model, lora_config)
# Only ~1% of parameters trained
```

## Evaluation Metrics

| Metric | Description | Typical Value |
|--------|-------------|---------------|
| Success Rate | Task completion | 70-90% |
| Generalization | Unseen objects | 40-70% |
| Language Grounding | Instruction following | 80-95% |
| Action Precision | MSE to demonstrations | < 0.01 |

## Challenges

### 1. Sim-to-Real Gap

Training in simulation doesn't transfer directly:

```python
# Domain randomization to bridge gap
def randomize_domain(scene):
    scene.lighting = random.uniform(0.5, 1.5)
    scene.camera_noise = random.uniform(0, 0.1)
    scene.object_textures = random.choice(textures)
    scene.friction = random.uniform(0.3, 1.0)
    return scene
```

### 2. Real-time Inference

VLA models are large. Optimization needed:

```python
# Quantization for deployment
from transformers import BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16
)
```

### 3. Safety

Language models can hallucinate. Add safety layers:

```python
def safe_action(action, workspace_bounds, velocity_limits):
    # Clip to workspace
    action[:3] = np.clip(action[:3], workspace_bounds[:, 0], workspace_bounds[:, 1])

    # Limit velocity
    action = np.clip(action, -velocity_limits, velocity_limits)

    return action
```

## Summary

VLA models unify:
- **Vision**: Understanding the scene
- **Language**: Following instructions
- **Action**: Executing physical tasks

This end-to-end approach enables more natural, generalizable robot behavior.

## Next Steps

- Implementing OpenVLA inference
- Collecting demonstration data
- Fine-tuning for specific tasks
- Deploying to physical robots

## References

1. Brohan et al. (2023). "RT-2: Vision-Language-Action Models"
2. Kim et al. (2024). "OpenVLA: An Open-Source Vision-Language-Action Model"
3. Driess et al. (2023). "PaLM-E: An Embodied Multimodal Language Model"
