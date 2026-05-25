import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, AchievementBadge, CategoryBadge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders as a span element', () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByText('Test').tagName).toBe('SPAN');
  });

  it('applies default variant', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass('bg-kv-gray-100');
  });

  it('applies primary variant', () => {
    const { container } = render(<Badge variant="primary">Primary</Badge>);
    expect(container.firstChild).toHaveClass('bg-kv-blue/15');
  });

  it('applies success variant', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    expect(container.firstChild).toHaveClass('bg-kv-green/15');
  });

  it('applies danger variant', () => {
    const { container } = render(<Badge variant="danger">Error</Badge>);
    expect(container.firstChild).toHaveClass('bg-kv-red/15');
  });

  it('applies size classes (sm)', () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    expect(container.firstChild).toHaveClass('text-xs');
  });

  it('applies size classes (lg)', () => {
    const { container } = render(<Badge size="lg">Large</Badge>);
    expect(container.firstChild).toHaveClass('text-base');
  });

  it('renders icon', () => {
    render(<Badge icon={<span data-testid="icon">🔥</span>}>Hot</Badge>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('icon has aria-hidden', () => {
    const { container } = render(<Badge icon={<span data-testid="icon">🔥</span>}>Hot</Badge>);
    // Icon is inside the first child span with aria-hidden
    const icon = container.querySelector('[data-testid="icon"]');
    expect(icon?.closest('[aria-hidden]') || icon?.parentElement?.hasAttribute('aria-hidden')).toBeTruthy();
  });

  it('does not render remove button by default', () => {
    render(<Badge>Tag</Badge>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders remove button when removable', () => {
    render(<Badge removable onRemove={() => {}}>Tag</Badge>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('remove button calls onRemove when clicked', async () => {
    const user = userEvent.setup();
    const handleRemove = vi.fn();
    render(<Badge removable onRemove={handleRemove}>Tag</Badge>);
    await user.click(screen.getByRole('button'));
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('applies pulse animation', () => {
    const { container } = render(<Badge pulse>Live</Badge>);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});

describe('AchievementBadge', () => {
  it('renders badge name and description', () => {
    render(<AchievementBadge name="Star Learner" description="Completed first lesson" emoji="⭐" />);
    expect(screen.getByText('Star Learner')).toBeInTheDocument();
    expect(screen.getByText('Completed first lesson')).toBeInTheDocument();
  });

  it('renders emoji', () => {
    render(<AchievementBadge name="Badge" description="Desc" emoji="🏆" />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('shows "Locked" when not earned', () => {
    const { container } = render(<AchievementBadge name="Locked" description="Not yet" emoji="🔒" earned={false} />);
    // "Locked" is in the DOM with CSS uppercase class
    const el = container.querySelector('.uppercase');
    expect(el).toBeInTheDocument();
    expect(el?.textContent).toBe('Locked');
  });

  it('does not show "Locked" when earned', () => {
    render(<AchievementBadge name="Unlocked" description="Done" emoji="🔓" earned />);
    expect(screen.queryByText('Locked')).not.toBeInTheDocument();
  });

  it('has correct aria-label when earned', () => {
    render(<AchievementBadge name="Winner" description="Won" emoji="🎉" earned earnedDate="Jan 15" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', expect.stringContaining('earned'));
  });

  it('has correct aria-label when not earned', () => {
    render(<AchievementBadge name="Locked" description="Not yet" emoji="🔒" earned={false} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', expect.stringContaining('not yet earned'));
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<AchievementBadge name="Click" description="Me" emoji="👆" onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('CategoryBadge', () => {
  it('renders label', () => {
    render(<CategoryBadge label="Math" active={false} onClick={() => {}} />);
    expect(screen.getByText('Math')).toBeInTheDocument();
  });

  it('renders emoji when provided', () => {
    render(<CategoryBadge label="Science" emoji="🔬" active={false} onClick={() => {}} />);
    expect(screen.getByText('🔬')).toBeInTheDocument();
  });

  it('applies active styling when active', () => {
    render(<CategoryBadge label="Active" active onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveClass('bg-kv-blue');
  });

  it('applies inactive styling when not active', () => {
    render(<CategoryBadge label="Inactive" active={false} onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveClass('bg-white');
  });

  it('has aria-pressed attribute', () => {
    render(<CategoryBadge label="Filter" active onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<CategoryBadge label="Click" active={false} onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
