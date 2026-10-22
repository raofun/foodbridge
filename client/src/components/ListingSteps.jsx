const steps = [
  { number: '01', label: 'Food listing' },
  { number: '02', label: 'Food information' },
  { number: '03', label: 'Pickup schedule' },
];

export default function ListingSteps({ current }) {
  return <nav className="listing-steps" aria-label="Create food listing steps">
    {steps.map((step, index) => <div className={`listing-step${step.number === current ? ' current' : ''}${Number(step.number) < Number(current) ? ' complete' : ''}`} key={step.number}>
      <span className="step-number">{Number(step.number) < Number(current) ? '✓' : step.number}</span>
      <span className="step-label">{step.label}</span>
      {index < steps.length - 1 && <span className="step-connector" aria-hidden="true" />}
    </div>)}
  </nav>;
}
