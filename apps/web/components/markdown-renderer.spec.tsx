import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from './markdown-renderer';

describe('MarkdownRenderer', () => {
  it('renders plain text', () => {
    render(<MarkdownRenderer content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders bold text', () => {
    render(<MarkdownRenderer content="**bold** text" />);
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('renders lists', () => {
    const { container } = render(
      <MarkdownRenderer content={'- item 1\n- item 2'} />
    );
    const items = container.querySelectorAll('li');
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(container.textContent).toContain('item 1');
    expect(container.textContent).toContain('item 2');
  });

  it('renders code blocks inside pre element', () => {
    const code = ['```typescript', 'const x = 1;', '```'].join('\n');
    const { container } = render(<MarkdownRenderer content={code} />);
    expect(container.querySelector('pre')).toBeInTheDocument();
  });

  it('renders inline code', () => {
    render(<MarkdownRenderer content="use `const` keyword" />);
    expect(screen.getByText('const')).toBeInTheDocument();
  });

  it('renders blockquotes', () => {
    render(<MarkdownRenderer content="> A wise quote" />);
    expect(screen.getByText('A wise quote')).toBeInTheDocument();
  });
});
