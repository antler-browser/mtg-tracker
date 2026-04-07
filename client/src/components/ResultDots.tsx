interface ResultDotsProps {
  results: ('W' | 'L')[]
  max?: number
}

export function ResultDots({ results, max = 10 }: ResultDotsProps) {
  const dots = results.slice(0, max)
  return (
    <div className="flex gap-[3px]">
      {dots.map((r, i) => (
        <span
          key={i}
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: r === 'W' ? '#66BB6A' : '#EF5350' }}
        />
      ))}
    </div>
  )
}
