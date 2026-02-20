import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import onnx

# ===== Configuration =====
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
IMG_SIZE = 28
BATCH_SIZE = 64
EPOCHS = 2
LR = 0.001
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

# ===== CNN Architecture =====
class DigitCNN(nn.Module):
    """Small CNN for MNIST digit classification."""
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            # Block 1: 28x28 -> 14x14
            nn.Conv2d(1, 16, 3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),

            # Block 2: 14x14 -> 7x7
            nn.Conv2d(16, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            
            # Block 3: 7x7 -> 3x3
            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.3),
            nn.Linear(64 * 3 * 3, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

def train():
    print(f"Device: {DEVICE}")
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs('data', exist_ok=True)

    # MNIST transforms
    # Note: MNIST is natively white digit on black background, exactly what we need!
    transform = transforms.Compose([
        transforms.ToTensor(),          # [0, 1] range
        transforms.Normalize([0.5], [0.5]), # Normalize to [-1, 1]
    ])

    # Load datasets
    print("Downloading/Loading MNIST...")
    train_set = datasets.MNIST(root='./data', train=True, download=True, transform=transform)
    test_set = datasets.MNIST(root='./data', train=False, download=True, transform=transform)

    train_loader = DataLoader(train_set, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    test_loader = DataLoader(test_set, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # Build model
    model = DigitCNN(num_classes=10).to(DEVICE)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LR)

    # Fast Training loop
    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0
        train_correct = 0
        train_total = 0

        for images, labels in train_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            train_total += labels.size(0)
            train_correct += predicted.eq(labels).sum().item()

        avg_train_loss = train_loss / train_total
        train_acc = 100.0 * train_correct / train_total
        print(f"Epoch {epoch+1:2d}/{EPOCHS}  train_loss={avg_train_loss:.4f}  train_acc={train_acc:.1f}%")

    # Evaluate
    model.eval()
    test_correct = 0
    test_total = 0
    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images)
            _, predicted = outputs.max(1)
            test_total += labels.size(0)
            test_correct += predicted.eq(labels).sum().item()
            
    test_acc = 100.0 * test_correct / test_total
    print(f"Overall Test Accuracy: {test_acc:.1f}%")

    # Save class names mapping
    class_map = {}
    for i in range(10):
        class_map[str(i)] = {
            'name': f"{i}",
            'symbol': f"{i}"
        }
    class_map_path = os.path.join(MODEL_DIR, 'class_names.json')
    with open(class_map_path, 'w', encoding='utf-8') as f:
        json.dump(class_map, f, indent=2)

    # Export to ONNX
    print("\nExporting to ONNX...")
    model.to('cpu')
    model.eval()
    dummy_input = torch.randn(1, 1, IMG_SIZE, IMG_SIZE)
    onnx_path = os.path.join(MODEL_DIR, 'digit_cnn.onnx')

    torch.onnx.export(
        model, dummy_input, onnx_path,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}},
        opset_version=13,
    )
    
    onnx_model = onnx.load(onnx_path)
    onnx.save_model(onnx_model, onnx_path, save_as_external_data=False)
    
    if os.path.exists(onnx_path + ".data"):
        os.remove(onnx_path + ".data")

    print(f"✅ complete! Model exported to {onnx_path}")

if __name__ == '__main__':
    train()
