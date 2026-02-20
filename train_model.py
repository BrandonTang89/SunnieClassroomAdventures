"""
train_model.py — Train a small CNN on Greek handwriting dataset.
Exports to ONNX for browser inference via ONNX Runtime Web.

Usage:
    python train_model.py

Outputs:
    model/greek_cnn.onnx — ONNX model for browser
    model/class_names.json — Mapping of class index to Greek symbol
"""

import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from PIL import Image
import time

# ===== Configuration =====
DATASET_ROOT = os.path.join(os.path.dirname(__file__),
    'greekDataset', 'Working Dataset_Split (70-15-15)')
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
IMG_SIZE = 64
BATCH_SIZE = 32
EPOCHS = 50
LR = 0.0005
WEIGHT_DECAY = 1e-4
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

# The 12 Greek letters we use in the game
TARGET_CLASSES = {
    'Alpha': 'α', 'Beta': 'β', 'Gamma': 'γ', 'Delta': 'δ',
    'Epsilon': 'ε', 'Theta': 'θ', 'Lamda': 'λ', 'Mu': 'μ',
    'Pi': 'π', 'Sigma': 'σ', 'Phi': 'φ', 'Omega': 'ω'
}

# ===== Custom Dataset that filters to target classes =====
class FilteredImageFolder(datasets.ImageFolder):
    """ImageFolder that only includes specific class directories."""

    def __init__(self, root, target_classes, transform=None):
        # Temporarily create the dataset to get the class-to-idx mapping
        super().__init__(root, transform=transform)

        # Filter to only target classes
        valid_classes = set(target_classes.keys())
        valid_indices = {self.class_to_idx[c] for c in valid_classes if c in self.class_to_idx}

        # Filter samples to only target classes and exclude rotated images
        filtered_samples = []
        for path, idx in self.samples:
            if idx in valid_indices and not os.path.basename(path).startswith('_'):
                filtered_samples.append((path, idx))
                
        self.samples = filtered_samples
        self.targets = [idx for _, idx in self.samples]
        self.imgs = self.samples

        # Remap indices to 0..N-1
        old_to_new = {}
        new_classes = []
        for i, cls_name in enumerate(sorted(valid_classes)):
            if cls_name in self.class_to_idx:
                old_to_new[self.class_to_idx[cls_name]] = i
                new_classes.append(cls_name)

        self.samples = [(path, old_to_new[idx]) for path, idx in self.samples]
        self.targets = [idx for _, idx in self.samples]
        self.imgs = self.samples
        self.class_names = new_classes
        self.num_classes = len(new_classes)


# ===== CNN Architecture =====
class GreekCNN(nn.Module):
    """Small CNN for Greek letter classification. ~50K parameters."""

    def __init__(self, num_classes=12):
        super().__init__()
        self.features = nn.Sequential(
            # Block 1: 64x64 -> 32x32
            nn.Conv2d(1, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),

            # Block 2: 32x32 -> 16x16
            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),

            # Block 3: 16x16 -> 8x8
            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
        )
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Dropout(0.5),
            nn.Linear(128, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


# ===== Data Transforms =====
def get_transforms():
    """Preprocessing: grayscale, resize, invert (so strokes are white on black), normalize."""

    train_transform = transforms.Compose([
        transforms.Grayscale(num_output_channels=1),
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomAffine(
            degrees=20,
            translate=(0.15, 0.15),
            scale=(0.85, 1.15),
            shear=10,
        ),
        transforms.RandomPerspective(distortion_scale=0.15, p=0.3),
        transforms.ToTensor(),          # [0, 1] range
        transforms.Lambda(lambda x: 1.0 - x),  # Invert: white bg → black bg, black stroke → white
        transforms.Normalize([0.5], [0.5]),     # Normalize to [-1, 1]
    ])

    eval_transform = transforms.Compose([
        transforms.Grayscale(num_output_channels=1),
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Lambda(lambda x: 1.0 - x),
        transforms.Normalize([0.5], [0.5]),
    ])

    return train_transform, eval_transform


def train():
    print(f"Device: {DEVICE}")
    print(f"Dataset root: {DATASET_ROOT}")

    train_transform, eval_transform = get_transforms()

    # Load datasets
    train_set = FilteredImageFolder(
        os.path.join(DATASET_ROOT, 'train'), TARGET_CLASSES, train_transform)
    val_set = FilteredImageFolder(
        os.path.join(DATASET_ROOT, 'val'), TARGET_CLASSES, eval_transform)
    test_set = FilteredImageFolder(
        os.path.join(DATASET_ROOT, 'test'), TARGET_CLASSES, eval_transform)

    print(f"Train: {len(train_set)} images, {train_set.num_classes} classes")
    print(f"Val:   {len(val_set)} images")
    print(f"Test:  {len(test_set)} images")
    print(f"Classes: {train_set.class_names}")

    train_loader = DataLoader(train_set, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_set, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_set, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # Build model
    model = GreekCNN(num_classes=train_set.num_classes).to(DEVICE)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Model params: {total_params:,}")

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-6)

    # Training loop with early stopping
    best_val_loss = float('inf')
    patience_counter = 0
    best_model_state = None

    for epoch in range(EPOCHS):
        t0 = time.time()

        # Train
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

        # Validate
        model.eval()
        val_loss = 0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()

        avg_train_loss = train_loss / train_total
        avg_val_loss = val_loss / val_total
        train_acc = 100.0 * train_correct / train_total
        val_acc = 100.0 * val_correct / val_total

        scheduler.step()

        elapsed = time.time() - t0
        print(f"Epoch {epoch+1:2d}/{EPOCHS}  "
              f"train_loss={avg_train_loss:.4f}  train_acc={train_acc:.1f}%  "
              f"val_loss={avg_val_loss:.4f}  val_acc={val_acc:.1f}%  "
              f"({elapsed:.1f}s)")

        # Early stopping
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            patience_counter = 0
            best_model_state = model.state_dict().copy()
        else:
            patience_counter += 1
            if patience_counter >= 10:
                print(f"Early stopping at epoch {epoch+1}")
                break

    # Load best model
    if best_model_state:
        model.load_state_dict(best_model_state)

    # ===== Test Evaluation =====
    print("\n===== Test Set Evaluation =====")
    model.eval()
    test_correct = 0
    test_total = 0
    class_correct = [0] * train_set.num_classes
    class_total = [0] * train_set.num_classes

    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images)
            _, predicted = outputs.max(1)
            test_total += labels.size(0)
            test_correct += predicted.eq(labels).sum().item()

            for i in range(labels.size(0)):
                label = labels[i].item()
                class_total[label] += 1
                class_correct[label] += int(predicted[i] == label)

    test_acc = 100.0 * test_correct / test_total
    print(f"Overall Test Accuracy: {test_acc:.1f}% ({test_correct}/{test_total})")
    print("\nPer-class accuracy:")
    for i, cls_name in enumerate(train_set.class_names):
        if class_total[i] > 0:
            acc = 100.0 * class_correct[i] / class_total[i]
            symbol = TARGET_CLASSES.get(cls_name, '?')
            print(f"  {cls_name:10s} ({symbol}): {acc:5.1f}% ({class_correct[i]}/{class_total[i]})")

    # ===== Save model checkpoint =====
    os.makedirs(MODEL_DIR, exist_ok=True)

    model.to('cpu')
    pth_path = os.path.join(MODEL_DIR, 'greek_cnn.pth')
    torch.save(model.state_dict(), pth_path)
    print(f"\nModel checkpoint saved to: {pth_path}")

    # Save class names mapping
    class_map = {}
    for i, cls_name in enumerate(train_set.class_names):
        class_map[str(i)] = {
            'name': cls_name,
            'symbol': TARGET_CLASSES.get(cls_name, '?')
        }

    class_map_path = os.path.join(MODEL_DIR, 'class_names.json')
    with open(class_map_path, 'w', encoding='utf-8') as f:
        json.dump(class_map, f, indent=2, ensure_ascii=False)
    print(f"Class names saved to: {class_map_path}")

    print("\n✅ Training complete!")
    print(f"   Checkpoint: {pth_path}")
    print(f"   Class map:  {class_map_path}")
    print("   Run export_onnx.py to convert to ONNX for browser.")


if __name__ == '__main__':
    train()
