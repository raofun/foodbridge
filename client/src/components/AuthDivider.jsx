export default function AuthDivider({ text = 'or continue with' }) {
  return (
    <div className="auth-micro-divider">
      <span>{text}</span>
    </div>
  );
}
