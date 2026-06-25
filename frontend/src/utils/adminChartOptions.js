export function delayedAnimation(type = 'bar') {
  const completed = new Set()

  return {
    duration: 800,
    easing: 'easeOutQuart',
    delay(context) {
      const chartKey = `${context.type}-${context.dataIndex}-${context.datasetIndex}`
      if (completed.has(chartKey)) return 0
      completed.add(chartKey)

      if (type === 'pie') return context.dataIndex * 130
      if (type === 'line') return context.dataIndex * 90 + context.datasetIndex * 120
      return context.dataIndex * 110 + context.datasetIndex * 80
    },
  }
}
