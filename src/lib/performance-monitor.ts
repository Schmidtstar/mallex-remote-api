
interface PerformanceMetrics {
  renderTime: number;
  scrollPerformance: number;
  memoryUsage: number;
  itemsRendered: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isMonitoring = import.meta.env.DEV;

  startRenderMeasure(label: string): void {
    if (!this.isMonitoring) return;
    performance.mark(`${label}-start`);
  }

  endRenderMeasure(label: string, itemCount: number): void {
    if (!this.isMonitoring) return;
    
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    const renderTime = measure.duration;
    
    // Memory usage estimation
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    
    this.metrics.push({
      renderTime,
      scrollPerformance: renderTime < 16 ? 100 : Math.max(0, 100 - (renderTime - 16) * 2),
      memoryUsage: memoryUsage / (1024 * 1024), // MB
      itemsRendered: itemCount
    });

    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-50); // Keep last 50 measurements
    }

    console.log(`🚀 Virtual Scrolling Performance:`, {
      renderTime: `${renderTime.toFixed(2)}ms`,
      itemCount,
      memoryMB: `${(memoryUsage / (1024 * 1024)).toFixed(1)}MB`,
      performance: renderTime < 16 ? '✅ Excellent' : renderTime < 33 ? '⚠️ Good' : '❌ Needs optimization'
    });
  }

  getAverageMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;

    const sum = this.metrics.reduce((acc, metric) => ({
      renderTime: acc.renderTime + metric.renderTime,
      scrollPerformance: acc.scrollPerformance + metric.scrollPerformance,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      itemsRendered: acc.itemsRendered + metric.itemsRendered
    }), { renderTime: 0, scrollPerformance: 0, memoryUsage: 0, itemsRendered: 0 });

    const count = this.metrics.length;
    return {
      renderTime: sum.renderTime / count,
      scrollPerformance: sum.scrollPerformance / count,
      memoryUsage: sum.memoryUsage / count,
      itemsRendered: sum.itemsRendered / count
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
