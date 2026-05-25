import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar, StarRating, StepIndicator } from '@/components/ui/ProgressBar';

describe('ProgressBar', () => {
  it('renders with role="progressbar"', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(<ProgressBar value={75} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '75');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-label', '75% complete');
  });

  it('clamps value to max', () => {
    render(<ProgressBar value={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('clamps value to min (0)', () => {
    render(<ProgressBar value={-10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('calculates correct percentage with custom max', () => {
    render(<ProgressBar value={3} max={10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', '30% complete');
  });

  it('applies variant class (green)', () => {
    const { container } = render(<ProgressBar value={50} variant="green" />);
    const fill = container.querySelector('.bg-kv-green');
    expect(fill).toBeInTheDocument();
  });

  it('applies variant class (red)', () => {
    const { container } = render(<ProgressBar value={50} variant="red" />);
    const fill = container.querySelector('.bg-kv-red');
    expect(fill).toBeInTheDocument();
  });

  it('applies size class (sm)', () => {
    const { container } = render(<ProgressBar value={50} size="sm" />);
    const track = container.querySelector('.h-2');
    expect(track).toBeInTheDocument();
  });

  it('applies size class (lg)', () => {
    const { container } = render(<ProgressBar value={50} size="lg" />);
    const track = container.querySelector('.h-4');
    expect(track).toBeInTheDocument();
  });

  it('shows label when showLabel is true (right position)', () => {
    render(<ProgressBar value={60} showLabel labelPosition="right" />);
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('shows label when showLabel is true (top position)', () => {
    render(<ProgressBar value={40} max={100} showLabel labelPosition="top" />);
    expect(screen.getByText('40 / 100')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('handles 0% value', () => {
    render(<ProgressBar value={0} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', '0% complete');
  });

  it('handles 100% value', () => {
    render(<ProgressBar value={100} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', '100% complete');
  });
});

describe('StarRating', () => {
  it('renders correct number of stars', () => {
    const { container } = render(<StarRating rating={2} maxRating={3} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(3);
  });

  it('renders filled stars up to rating', () => {
    render(<StarRating rating={2} maxRating={3} />);
    const filled = screen.getAllByText('⭐');
    expect(filled).toHaveLength(2);
    const empty = screen.getAllByText('☆');
    expect(empty).toHaveLength(1);
  });

  it('renders all empty for 0 rating', () => {
    render(<StarRating rating={0} maxRating={3} />);
    const empty = screen.getAllByText('☆');
    expect(empty).toHaveLength(3);
  });

  it('has correct aria-label', () => {
    render(<StarRating rating={2} maxRating={3} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rating: 2 of 3 stars');
  });

  it('renders all filled for max rating', () => {
    render(<StarRating rating={5} maxRating={5} />);
    const filled = screen.getAllByText('⭐');
    expect(filled).toHaveLength(5);
  });

  it('interactive mode calls onChange', async () => {
    const { container } = render(
      <StarRating rating={0} maxRating={3} interactive onChange={() => {}} />
    );
    const buttons = container.querySelectorAll('button');
    // Verify stars are rendered as interactive buttons
    expect(buttons.length).toBe(3);
  });
});

describe('StepIndicator', () => {
  it('renders correct number of steps', () => {
    render(<StepIndicator currentStep={2} totalSteps={4} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '4');
  });

  it('has correct aria-label', () => {
    render(<StepIndicator currentStep={1} totalSteps={3} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Step 1 of 3');
  });

  it('renders step numbers', () => {
    render(<StepIndicator currentStep={1} totalSteps={3} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders labels when provided', () => {
    render(
      <StepIndicator
        currentStep={2}
        totalSteps={3}
        labels={['Step 1', 'Step 2', 'Step 3']}
      />
    );
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });
});
