# Common Modal Component

A flexible, reusable modal system that eliminates duplicate modal code and CSS conflicts across components.

## 🎯 **Problem Solved**

- **Multiple duplicate modal implementations** across components (Jobs.jsx, HiringAgency.jsx, AddCandidates.jsx, etc.)
- **Conflicting CSS classes** (`modal-overlay`, `modal-content`, etc.) causing styling issues
- **Inconsistent modal behavior** (animations, keyboard handling, backdrop clicks)
- **Code duplication** and maintenance overhead

## 🚀 **Features**

- **Consistent styling** and behavior across all modals
- **Flexible sizing** (small, medium, large, fullscreen)
- **Multiple variants** (default, confirm, form)
- **Built-in animations** (fade, slide, scale)
- **Keyboard support** (Escape key)
- **Backdrop click handling**
- **Responsive design** and dark mode support
- **Accessibility** features (ARIA labels, focus management)

## 📖 **Usage**

### Basic Modal

```jsx
import Modal from './common/Modal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="My Modal"
      size="medium"
    >
      <p>Modal content goes here</p>
    </Modal>
  );
}
```

### Form Modal

```jsx
import { FormModal } from './common/Modal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Handle form submission
    setIsSubmitting(false);
    setIsOpen(false);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSubmit={handleSubmit}
      title="Create Item"
      submitText="Create"
      isSubmitting={isSubmitting}
    >
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input type="text" id="name" required />
      </div>
    </FormModal>
  );
}
```

### Confirm Modal

```jsx
import { ConfirmModal } from './common/Modal';

function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    // Handle deletion
    setShowConfirm(false);
  };

  return (
    <ConfirmModal
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      onConfirm={handleDelete}
      title="Confirm Deletion"
      message="Are you sure you want to delete this item? This action cannot be undone."
      confirmText="Delete"
      confirmButtonClass="btn-danger"
    />
  );
}
```

## ⚙️ **Props**

### Modal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | - | Controls modal visibility |
| `onClose` | function | - | Called when modal should close |
| `title` | string | - | Modal title |
| `children` | ReactNode | - | Modal content |
| `size` | string | 'medium' | Modal size: 'small', 'medium', 'large', 'fullscreen' |
| `variant` | string | 'default' | Modal variant: 'default', 'confirm', 'form' |
| `showCloseButton` | boolean | true | Show X button in header |
| `showHeader` | boolean | true | Show modal header |
| `showFooter` | boolean | false | Show modal footer |
| `footer` | ReactNode | - | Custom footer content |
| `closeOnBackdrop` | boolean | true | Close on backdrop click |
| `closeOnEscape` | boolean | true | Close on Escape key |
| `zIndex` | number | 1000 | Modal z-index |
| `animation` | string | 'fade' | Animation: 'fade', 'slide', 'scale' |

### FormModal Additional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSubmit` | function | - | Form submit handler |
| `submitText` | string | 'Submit' | Submit button text |
| `cancelText` | string | 'Cancel' | Cancel button text |
| `isSubmitting` | boolean | false | Shows loading state |
| `submitDisabled` | boolean | false | Disables submit button |

### ConfirmModal Additional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onConfirm` | function | - | Confirm action handler |
| `message` | string | - | Confirmation message |
| `confirmText` | string | 'Confirm' | Confirm button text |
| `cancelText` | string | 'Cancel' | Cancel button text |
| `confirmButtonClass` | string | 'btn-danger' | Confirm button style |

## 🔄 **Migration Guide**

### Before (Old Modal)

```jsx
{showModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h3>My Modal</h3>
        <button onClick={() => setShowModal(false)}>×</button>
      </div>
      <div className="modal-body">
        <form onSubmit={handleSubmit}>
          <input type="text" />
          <div className="modal-footer">
            <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
```

### After (New Modal)

```jsx
<FormModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSubmit={handleSubmit}
  title="My Modal"
  submitText="Submit"
>
  <div className="form-group">
    <input type="text" />
  </div>
</FormModal>
```

## 🎨 **Styling**

The modal uses CSS custom properties for theming. You can override these in your component CSS:

```css
.my-custom-modal {
  --modal-border-radius: 8px;
  --modal-padding: 20px;
  --modal-backdrop-color: rgba(0, 0, 0, 0.7);
}
```

## 🔧 **Z-Index Management**

Default z-index values:
- Toast notifications: 9999
- Modals: 1000 (configurable)
- DataTable context menus: 1000
- Dropdowns: 50

## 📱 **Responsive Behavior**

- Mobile: Full width with reduced padding
- Desktop: Centered with max-width constraints
- Touch-friendly button sizes on mobile
- Stacked buttons on small screens

## 🌙 **Dark Mode**

Automatic dark mode support based on `prefers-color-scheme: dark`.

## ♿ **Accessibility**

- Focus trap within modal
- Escape key support
- ARIA labels for screen readers
- Keyboard navigation support

## 🚀 **Benefits**

- ✅ **Consistent UX** across all modals
- ✅ **Reduced bundle size** (shared CSS/JS)
- ✅ **Easier maintenance** (single source of truth)
- ✅ **Better performance** (optimized animations)
- ✅ **No CSS conflicts** (scoped class names)
- ✅ **Built-in best practices** (a11y, UX patterns)

## 📋 **Migration Checklist**

For each component with modals:

1. [ ] Import `Modal`, `FormModal`, or `ConfirmModal`
2. [ ] Replace old modal JSX with new component
3. [ ] Move form logic to `onSubmit` prop
4. [ ] Remove custom modal CSS classes
5. [ ] Test modal functionality
6. [ ] Remove unused modal state/handlers
7. [ ] Update any custom styling to use new classes

## 🎯 **Next Steps**

1. **Migrate existing modals** one by one
2. **Remove duplicate CSS** after migration
3. **Add custom variants** if needed for specific use cases
4. **Consider modal stacking** for complex workflows
