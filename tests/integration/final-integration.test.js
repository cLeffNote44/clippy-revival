/**
 * Final Integration Tests
 *
 * Comprehensive integration tests for the complete Clippy Revival application.
 * Tests all major features and their interactions.
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Import all major systems
import { healthCheck, metrics, errorTracker, performanceMonitor } from '../../src/utils/monitoring';
import { analytics, usageMetrics, privacyLogger } from '../../src/utils/analytics';
import { pluginManager } from '../../src/utils/plugins';
import { themeManager } from '../../src/utils/themes';
import { contextMemory, personaManager } from '../../src/utils/ai-advanced';
import { aria, FocusManager, validateContrast } from '../../src/utils/accessibility';
import { httpClient } from '../../src/services/http';

describe('Final Integration Tests', () => {
  beforeEach(() => {
    // Clear all state
    localStorage.clear();
    sessionStorage.clear();
    healthCheck.clear();
    metrics.reset();
    errorTracker.clear();
    performanceMonitor.clear();
    analytics.clearEvents();
    usageMetrics.clear();
    privacyLogger.clear();
    contextMemory.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('System Integration', () => {
    it('should initialize all core systems', async () => {
      // Test monitoring system
      expect(healthCheck).toBeDefined();
      expect(metrics).toBeDefined();
      expect(errorTracker).toBeDefined();
      expect(performanceMonitor).toBeDefined();

      // Test analytics system
      expect(analytics).toBeDefined();
      expect(usageMetrics).toBeDefined();
      expect(privacyLogger).toBeDefined();

      // Test advanced features
      expect(pluginManager).toBeDefined();
      expect(themeManager).toBeDefined();
      expect(contextMemory).toBeDefined();
      expect(personaManager).toBeDefined();
    });

    it('should run all health checks successfully', async () => {
      const report = await healthCheck.runAllChecks();

      expect(report.status).toBeDefined();
      expect(report.checks).toBeInstanceOf(Array);
      expect(report.summary).toBeDefined();
      expect(report.summary.total).toBeGreaterThan(0);
    });

    it('should collect and report metrics', () => {
      // Record some metrics
      metrics.counter('test_counter', 5);
      metrics.gauge('test_gauge', 100);
      metrics.histogram('test_histogram', 50);
      metrics.histogram('test_histogram', 75);
      metrics.histogram('test_histogram', 100);

      const allMetrics = metrics.getAllMetrics();

      expect(allMetrics.metrics).toBeDefined();
      expect(allMetrics.uptime).toBeGreaterThan(0);
      expect(allMetrics.metrics['test_counter']).toBeDefined();
      expect(allMetrics.metrics['test_counter'].value).toBe(5);
      expect(allMetrics.metrics['test_gauge'].value).toBe(100);
    });

    it('should track and aggregate errors', () => {
      const error1 = new Error('Test error 1');
      const error2 = new Error('Test error 2');
      const error3 = new Error('Test error 1'); // Duplicate

      errorTracker.trackError(error1);
      errorTracker.trackError(error2);
      errorTracker.trackError(error3);

      const stats = errorTracker.getErrorStats();
      const recentErrors = errorTracker.getRecentErrors(5);

      expect(stats.total).toBe(3);
      expect(recentErrors).toHaveLength(3);
      expect(stats.topErrors).toBeInstanceOf(Array);
    });

    it('should monitor performance', () => {
      performanceMonitor.mark('operation-start');

      // Simulate operation
      for (let i = 0; i < 1000; i++) {
        Math.sqrt(i);
      }

      performanceMonitor.mark('operation-end');
      const duration = performanceMonitor.measure(
        'operation',
        'operation-start',
        'operation-end'
      );

      expect(duration).toBeGreaterThanOrEqual(0);

      const summary = performanceMonitor.getSummary();
      expect(summary).toBeDefined();
      expect(summary['operation']).toBeDefined();
    });
  });

  describe('Analytics Integration', () => {
    it('should respect user consent for analytics', () => {
      // Default: disabled
      expect(analytics.enabled).toBe(false);

      // Enable analytics
      analytics.setConsent(true);
      expect(analytics.enabled).toBe(true);
      expect(localStorage.getItem('analytics_consent')).toBe('true');

      // Disable analytics
      analytics.setConsent(false);
      expect(analytics.enabled).toBe(false);
      expect(localStorage.getItem('analytics_consent')).toBe('false');
    });

    it('should track events when enabled', () => {
      analytics.setConsent(true);

      analytics.trackFeatureUsage('test-feature');
      analytics.trackCommandExecution('test-command');
      analytics.trackPerformance('test-metric', 100);

      const summary = analytics.getSummary();
      expect(summary.totalEvents).toBeGreaterThan(0);
      expect(summary.eventsByType).toBeDefined();
    });

    it('should not track events when disabled', () => {
      analytics.setConsent(false);

      analytics.trackFeatureUsage('test-feature');
      analytics.trackCommandExecution('test-command');

      const summary = analytics.getSummary();
      expect(summary.totalEvents).toBe(0);
    });

    it('should collect usage metrics', () => {
      usageMetrics.recordFeatureUsage('feature-1');
      usageMetrics.recordFeatureUsage('feature-1');
      usageMetrics.recordFeatureUsage('feature-2');
      usageMetrics.recordCommandUsage('command-1', 50);
      usageMetrics.recordCommandUsage('command-1', 100);

      const topFeatures = usageMetrics.getTopFeatures(5);
      const topCommands = usageMetrics.getTopCommands(5);

      expect(topFeatures).toHaveLength(2);
      expect(topFeatures[0].name).toBe('feature-1');
      expect(topFeatures[0].count).toBe(2);
      expect(topCommands).toHaveLength(1);
      expect(topCommands[0].id).toBe('command-1');
      expect(topCommands[0].avgDuration).toBe(75);
    });

    it('should sanitize sensitive data in logs', () => {
      const message = 'User email: test@example.com, Token: abc123def456ghi789jkl012mno345pqr678stu901';
      const sanitized = privacyLogger.sanitize(message);

      expect(sanitized).not.toContain('test@example.com');
      expect(sanitized).not.toContain('abc123def456ghi789jkl012mno345pqr678stu901');
      expect(sanitized).toContain('[email]');
      expect(sanitized).toContain('[redacted]');
    });
  });

  describe('Plugin System Integration', () => {
    it('should register and activate plugins', async () => {
      class TestPlugin {
        constructor() {
          this.id = 'test-plugin';
          this.name = 'Test Plugin';
          this.version = '1.0.0';
          this.description = 'A test plugin';
          this.activated = false;
        }

        async onInit() {
          // Initialize plugin
        }

        async onActivate() {
          this.activated = true;
        }

        async onDeactivate() {
          this.activated = false;
        }
      }

      const plugin = new TestPlugin();
      await pluginManager.registerPlugin(plugin);
      await pluginManager.activatePlugin('test-plugin');

      expect(plugin.activated).toBe(true);

      const allPlugins = pluginManager.getAllPlugins();
      expect(allPlugins).toHaveLength(1);
      expect(allPlugins[0].id).toBe('test-plugin');
    });

    it('should execute plugin hooks', async () => {
      let hookExecuted = false;

      class HookPlugin {
        constructor() {
          this.id = 'hook-plugin';
          this.name = 'Hook Plugin';
          this.version = '1.0.0';
        }

        async onInit() {
          this.registerHook('onMessage', async (data) => {
            hookExecuted = true;
            return { ...data, modified: true };
          });
        }
      }

      const plugin = new HookPlugin();
      await pluginManager.registerPlugin(plugin);
      await pluginManager.activatePlugin('hook-plugin');

      const result = await pluginManager.executeHook('onMessage', { text: 'Hello' });

      expect(hookExecuted).toBe(true);
      expect(result.modified).toBe(true);
    });
  });

  describe('Theme System Integration', () => {
    it('should create and apply themes', () => {
      const theme = themeManager
        .createBuilder('light')
        .setName('Test Theme')
        .setPrimaryColor('#E91E63')
        .setSecondaryColor('#9C27B0')
        .build();

      themeManager.registerTheme(theme);
      themeManager.applyTheme('Test Theme');

      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme.name).toBe('Test Theme');
      expect(currentTheme.palette.primary.main).toBe('#E91E63');
    });

    it('should validate theme accessibility', () => {
      const theme = themeManager
        .createBuilder('light')
        .setName('Low Contrast Theme')
        .setPrimaryColor('#CCCCCC') // Low contrast
        .build();

      const validation = theme.validateAccessibility();

      // This should fail accessibility checks
      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    it('should apply theme to DOM', () => {
      const theme = themeManager
        .createBuilder('dark')
        .setName('Dark Theme')
        .setPrimaryColor('#2196F3')
        .build();

      themeManager.registerTheme(theme);
      themeManager.applyTheme('Dark Theme');

      const root = document.documentElement;
      expect(root.classList.contains('theme-dark')).toBe(true);
    });
  });

  describe('AI Advanced Features Integration', () => {
    it('should manage conversation context', () => {
      contextMemory.createConversation('conv-1', { title: 'Test Chat' });

      contextMemory.addMessage('conv-1', 'user', 'Hello');
      contextMemory.addMessage('conv-1', 'assistant', 'Hi there!');
      contextMemory.addMessage('conv-1', 'user', 'How are you?');
      contextMemory.addMessage('conv-1', 'assistant', "I'm doing well!");

      const context = contextMemory.getContext('conv-1', { maxMessages: 10 });

      expect(context.messages).toHaveLength(4);
      expect(context.messageCount).toBe(4);
      expect(context.messages[0].role).toBe('user');
      expect(context.messages[0].content).toBe('Hello');
    });

    it('should search across conversations', () => {
      contextMemory.createConversation('conv-1');
      contextMemory.addMessage('conv-1', 'user', 'Tell me about JavaScript');
      contextMemory.addMessage('conv-1', 'assistant', 'JavaScript is a programming language');

      contextMemory.createConversation('conv-2');
      contextMemory.addMessage('conv-2', 'user', 'What is Python?');
      contextMemory.addMessage('conv-2', 'assistant', 'Python is also a programming language');

      const results = contextMemory.search('JavaScript', { limit: 10 });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].message.content).toContain('JavaScript');
    });

    it('should manage AI personas', () => {
      const codingPersona = personaManager.getPersona('coding');
      expect(codingPersona).toBeDefined();
      expect(codingPersona.name).toBe('Coding Assistant');

      personaManager.setActivePersona('coding');
      const activePersona = personaManager.getActivePersona();

      expect(activePersona.id).toBe('coding');

      const config = activePersona.getAIConfig();
      expect(config.systemPrompt).toBeDefined();
      expect(config.temperature).toBeDefined();
    });
  });

  describe('Accessibility Integration', () => {
    it('should provide ARIA helpers', () => {
      const labelProps = aria.label('Close button');
      expect(labelProps['aria-label']).toBe('Close button');

      const expandedProps = aria.expanded(true);
      expect(expandedProps['aria-expanded']).toBe(true);

      const dialogProps = aria.dialog('dialog-title', 'dialog-desc');
      expect(dialogProps.role).toBe('dialog');
      expect(dialogProps['aria-modal']).toBe('true');
    });

    it('should manage focus correctly', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <button id="btn3">Button 3</button>
      `;
      document.body.appendChild(container);

      const focusManager = new FocusManager();
      const focusableElements = focusManager.getFocusableElements(container);

      expect(focusableElements).toHaveLength(3);

      focusManager.focusFirst(container);
      expect(document.activeElement.id).toBe('btn1');

      focusManager.focusLast(container);
      expect(document.activeElement.id).toBe('btn3');

      document.body.removeChild(container);
    });

    it('should validate color contrast', () => {
      // Good contrast
      const goodContrast = validateContrast('#000000', '#FFFFFF');
      expect(goodContrast.passes).toBe(true);
      expect(goodContrast.ratio).toBeGreaterThan(4.5);

      // Poor contrast
      const poorContrast = validateContrast('#CCCCCC', '#FFFFFF');
      expect(poorContrast.passes).toBe(false);
      expect(poorContrast.ratio).toBeLessThan(4.5);
    });
  });

  describe('End-to-End Workflow Integration', () => {
    it('should complete a full user workflow with monitoring', async () => {
      // 1. Initialize monitoring
      performanceMonitor.mark('workflow-start');

      // 2. Track feature usage
      usageMetrics.recordFeatureUsage('chat');
      analytics.setConsent(true);
      analytics.trackFeatureUsage('chat');

      // 3. Set theme
      const theme = themeManager.getTheme('light');
      themeManager.applyTheme(theme.id);

      // 4. Create conversation
      contextMemory.createConversation('test-conv', { title: 'Test' });
      contextMemory.addMessage('test-conv', 'user', 'Hello');

      // 5. Track performance
      performanceMonitor.mark('workflow-end');
      const duration = performanceMonitor.measure(
        'workflow',
        'workflow-start',
        'workflow-end'
      );

      // 6. Record metrics
      metrics.histogram('workflow_duration', duration);

      // Verify everything worked
      expect(duration).toBeGreaterThanOrEqual(0);

      const usageSummary = usageMetrics.getUsageSummary();
      expect(usageSummary.features.total).toBeGreaterThan(0);

      const analyticsSummary = analytics.getSummary();
      expect(analyticsSummary.totalEvents).toBeGreaterThan(0);

      const context = contextMemory.getContext('test-conv');
      expect(context.messages).toHaveLength(1);
    });

    it('should handle errors gracefully across all systems', () => {
      const error = new Error('Test integration error');

      // Track error in all systems
      errorTracker.trackError(error, { component: 'integration-test' });
      privacyLogger.error('Integration error occurred', { error: error.message });
      analytics.setConsent(true);
      analytics.trackError(error, { test: true });

      // Verify error tracking
      const recentErrors = errorTracker.getRecentErrors(5);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].message).toBe('Test integration error');

      const logs = privacyLogger.getLogs({ level: 'error' });
      expect(logs.length).toBeGreaterThan(0);

      const analyticsSummary = analytics.getSummary();
      expect(analyticsSummary.eventsByType['app_error']).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    it('should handle high load scenarios', async () => {
      const startTime = Date.now();

      // Simulate high load
      for (let i = 0; i < 100; i++) {
        metrics.counter('requests', 1);
        usageMetrics.recordFeatureUsage(`feature-${i % 10}`);

        if (i % 10 === 0) {
          contextMemory.addMessage('load-test', 'user', `Message ${i}`);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);

      // Verify all metrics were recorded
      const allMetrics = metrics.getAllMetrics();
      expect(allMetrics.metrics['requests'].value).toBe(100);

      const topFeatures = usageMetrics.getTopFeatures(5);
      expect(topFeatures.length).toBeGreaterThan(0);
    });
  });

  describe('Security Integration', () => {
    it('should sanitize all sensitive data', () => {
      const sensitiveData = {
        email: 'user@example.com',
        password: 'secret123',
        token: 'abc123def456',
        normalData: 'This is fine',
      };

      // Analytics should sanitize
      analytics.setConsent(true);
      const event = analytics.track('test', sensitiveData);
      expect(event.properties.email).toBeUndefined();
      expect(event.properties.password).toBeUndefined();
      expect(event.properties.token).toBeUndefined();
      expect(event.properties.normalData).toBe('This is fine');

      // Logger should sanitize
      const message = 'User email is user@example.com';
      const sanitized = privacyLogger.sanitize(message);
      expect(sanitized).not.toContain('user@example.com');
      expect(sanitized).toContain('[email]');
    });
  });
});
