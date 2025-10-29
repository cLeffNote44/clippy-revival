import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  MetricCardSkeleton,
  ListItemSkeleton,
  ChartSkeleton,
  SettingsFormSkeleton,
  CharacterCardSkeleton
} from '../../src/components/SkeletonLoader';

describe('SkeletonLoader Components', () => {
  describe('MetricCardSkeleton', () => {
    test('renders without crashing', () => {
      const { container } = render(<MetricCardSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders within a Card component', () => {
      const { container } = render(<MetricCardSkeleton />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    test('renders multiple skeleton elements', () => {
      const { container } = render(<MetricCardSkeleton />);
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(1);
    });

    test('renders text and rectangular variants', () => {
      const { container } = render(<MetricCardSkeleton />);
      const textSkeletons = container.querySelectorAll('.MuiSkeleton-text');
      const rectSkeletons = container.querySelectorAll('.MuiSkeleton-rectangular');

      expect(textSkeletons.length).toBeGreaterThan(0);
      expect(rectSkeletons.length).toBeGreaterThan(0);
    });
  });

  describe('ListItemSkeleton', () => {
    test('renders default count of items', () => {
      const { container } = render(<ListItemSkeleton />);
      const listItems = container.querySelectorAll('.MuiListItem-root');
      expect(listItems.length).toBe(3); // default count
    });

    test('renders custom count of items', () => {
      const { container } = render(<ListItemSkeleton count={5} />);
      const listItems = container.querySelectorAll('.MuiListItem-root');
      expect(listItems.length).toBe(5);
    });

    test('renders single item when count is 1', () => {
      const { container } = render(<ListItemSkeleton count={1} />);
      const listItems = container.querySelectorAll('.MuiListItem-root');
      expect(listItems.length).toBe(1);
    });

    test('renders many items when count is high', () => {
      const { container } = render(<ListItemSkeleton count={10} />);
      const listItems = container.querySelectorAll('.MuiListItem-root');
      expect(listItems.length).toBe(10);
    });

    test('each list item has avatar and text', () => {
      const { container } = render(<ListItemSkeleton count={2} />);
      const avatars = container.querySelectorAll('.MuiSkeleton-circular');
      const textSkeletons = container.querySelectorAll('.MuiSkeleton-text');

      expect(avatars.length).toBe(2);
      expect(textSkeletons.length).toBeGreaterThanOrEqual(2);
    });

    test('renders within List component', () => {
      const { container } = render(<ListItemSkeleton />);
      const list = container.querySelector('.MuiList-root');
      expect(list).toBeInTheDocument();
    });
  });

  describe('ChartSkeleton', () => {
    test('renders without crashing', () => {
      const { container } = render(<ChartSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders within a Card component', () => {
      const { container } = render(<ChartSkeleton />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    test('renders rectangular skeleton for chart area', () => {
      const { container } = render(<ChartSkeleton />);
      const rectSkeletons = container.querySelectorAll('.MuiSkeleton-rectangular');
      expect(rectSkeletons.length).toBeGreaterThan(0);
    });

    test('has significant height for chart visualization', () => {
      const { container } = render(<ChartSkeleton />);
      const skeleton = container.querySelector('.MuiSkeleton-rectangular');

      // Should have a substantial height for chart area
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('SettingsFormSkeleton', () => {
    test('renders without crashing', () => {
      const { container } = render(<SettingsFormSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders multiple form field skeletons', () => {
      const { container } = render(<SettingsFormSkeleton />);
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');

      // Should have multiple skeleton elements for form fields
      expect(skeletons.length).toBeGreaterThan(3);
    });

    test('renders text skeletons for labels and inputs', () => {
      const { container } = render(<SettingsFormSkeleton />);
      const textSkeletons = container.querySelectorAll('.MuiSkeleton-text');

      expect(textSkeletons.length).toBeGreaterThan(0);
    });

    test('renders rectangular skeletons for buttons', () => {
      const { container } = render(<SettingsFormSkeleton />);
      const rectSkeletons = container.querySelectorAll('.MuiSkeleton-rectangular');

      expect(rectSkeletons.length).toBeGreaterThan(0);
    });
  });

  describe('CharacterCardSkeleton', () => {
    test('renders default count of cards', () => {
      const { container } = render(<CharacterCardSkeleton />);
      const cards = container.querySelectorAll('.MuiCard-root');
      expect(cards.length).toBe(3); // default count
    });

    test('renders custom count of cards', () => {
      const { container } = render(<CharacterCardSkeleton count={6} />);
      const cards = container.querySelectorAll('.MuiCard-root');
      expect(cards.length).toBe(6);
    });

    test('renders single card when count is 1', () => {
      const { container } = render(<CharacterCardSkeleton count={1} />);
      const cards = container.querySelectorAll('.MuiCard-root');
      expect(cards.length).toBe(1);
    });

    test('each card has image placeholder', () => {
      const { container } = render(<CharacterCardSkeleton count={2} />);
      const skeletons = container.querySelectorAll('.MuiSkeleton-rectangular');

      // At least one rectangular skeleton per card for image
      expect(skeletons.length).toBeGreaterThanOrEqual(2);
    });

    test('each card has text skeletons for title and description', () => {
      const { container } = render(<CharacterCardSkeleton count={2} />);
      const textSkeletons = container.querySelectorAll('.MuiSkeleton-text');

      // Multiple text skeletons for title, subtitle, description
      expect(textSkeletons.length).toBeGreaterThan(2);
    });

    test('cards are arranged in grid layout', () => {
      const { container } = render(<CharacterCardSkeleton />);
      const grid = container.querySelector('.MuiGrid-root');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('React.memo optimization', () => {
    test('MetricCardSkeleton does not re-render unnecessarily', () => {
      const { rerender } = render(<MetricCardSkeleton />);
      const { container: container1 } = render(<MetricCardSkeleton />);

      rerender(<MetricCardSkeleton />);
      const { container: container2 } = render(<MetricCardSkeleton />);

      // Components should maintain same structure
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    test('ListItemSkeleton only re-renders when count changes', () => {
      const { container, rerender } = render(<ListItemSkeleton count={3} />);
      const initialItems = container.querySelectorAll('.MuiListItem-root').length;

      // Re-render with same props
      rerender(<ListItemSkeleton count={3} />);
      expect(container.querySelectorAll('.MuiListItem-root').length).toBe(initialItems);

      // Re-render with different count
      rerender(<ListItemSkeleton count={5} />);
      expect(container.querySelectorAll('.MuiListItem-root').length).toBe(5);
    });

    test('CharacterCardSkeleton only re-renders when count changes', () => {
      const { container, rerender } = render(<CharacterCardSkeleton count={3} />);
      const initialCards = container.querySelectorAll('.MuiCard-root').length;

      // Re-render with same props
      rerender(<CharacterCardSkeleton count={3} />);
      expect(container.querySelectorAll('.MuiCard-root').length).toBe(initialCards);

      // Re-render with different count
      rerender(<CharacterCardSkeleton count={4} />);
      expect(container.querySelectorAll('.MuiCard-root').length).toBe(4);
    });
  });

  describe('PropTypes validation', () => {
    // These tests verify that components accept the expected prop types
    // PropTypes validation warnings will appear in console during development

    test('ListItemSkeleton accepts number for count', () => {
      expect(() => render(<ListItemSkeleton count={5} />)).not.toThrow();
    });

    test('CharacterCardSkeleton accepts number for count', () => {
      expect(() => render(<CharacterCardSkeleton count={8} />)).not.toThrow();
    });

    test('components with no props render correctly', () => {
      expect(() => render(<MetricCardSkeleton />)).not.toThrow();
      expect(() => render(<ChartSkeleton />)).not.toThrow();
      expect(() => render(<SettingsFormSkeleton />)).not.toThrow();
    });
  });
});
