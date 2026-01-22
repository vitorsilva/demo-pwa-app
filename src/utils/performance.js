import { onCLS, onINP, onLCP } from 'web-vitals';
import { logger } from './logger.js';
import { telemetry } from './telemetry.js';

/**
 * Initialize Core Web Vitals monitoring
 */
export function initPerformanceMonitoring() {
  // Largest Contentful Paint - loading performance
  onLCP((metric) => {
    const data = {
      value: Math.round(metric.value),
      rating: metric.rating, // 'good', 'needs-improvement', or 'poor'
    };
    logger.perf('LCP', data);
    // Direct telemetry for Web Vitals (marked as 'vital' for easy filtering)
    telemetry.track('vital', { name: 'LCP', ...data });
  });

  // Interaction to Next Paint - interactivity (replaced FID in 2024)
  onINP((metric) => {
    const data = {
      value: Math.round(metric.value),
      rating: metric.rating,
    };
    logger.perf('INP', data);
    telemetry.track('vital', { name: 'INP', ...data });
  });

  // Cumulative Layout Shift - visual stability
  onCLS((metric) => {
    const data = {
      value: metric.value.toFixed(3),
      rating: metric.rating,
    };
    logger.perf('CLS', data);
    telemetry.track('vital', { name: 'CLS', ...data });
  });

  logger.info('Performance monitoring initialized');
}
