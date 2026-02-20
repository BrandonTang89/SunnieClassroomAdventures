"""
export_onnx.py — Export the trained Greek CNN to ONNX format.
Workaround for torch.onnx issues on Python 3.14.
"""

import os
import json
import torch
import torch.nn as nn

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
IMG_SIZE = 64

# Replicate the model architecture
class GreekCNN(nn.Module):
    def __init__(self, num_classes=12):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
        )
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


if __name__ == '__main__':
    # Load checkpoint
    ckpt_path = os.path.join(MODEL_DIR, 'greek_cnn.pth')
    if not os.path.exists(ckpt_path):
        print(f"Error: checkpoint not found at {ckpt_path}")
        exit(1)

    model = GreekCNN(num_classes=12)
    model.load_state_dict(torch.load(ckpt_path, map_location='cpu', weights_only=True))
    model.eval()

    dummy_input = torch.randn(1, 1, IMG_SIZE, IMG_SIZE)
    onnx_path = os.path.join(MODEL_DIR, 'greek_cnn.onnx')

    torch.onnx.export(
        model, dummy_input, onnx_path,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}},
        opset_version=13,
    )

    # Verify
    import onnx
    onnx_model = onnx.load(onnx_path)
    onnx.checker.check_model(onnx_model)
    print(f"✅ ONNX model exported and verified: {onnx_path}")
    print(f"   Size: {os.path.getsize(onnx_path) / 1024:.1f} KB")
