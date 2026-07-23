interface SkillBadgeProps {
  skill: string
}

export function SkillBadge({ skill }: SkillBadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-accent/10 text-accent border border-accent/20">
      {skill}
    </span>
  )
}
