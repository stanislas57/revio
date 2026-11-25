import {
  Award,
  CalendarCheck,
  Crown,
  Flame,
  Footprints,
  Gem,
  GraduationCap,
  Medal,
  ShieldCheck,
  Target,
  Timer,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import type { Achievement } from "../contracts";

/**
 * Icon of an achievement (the contract has no icon field): chosen by id, then by category.
 * Written as explicit JSX so the icon is a static component, not one created during render.
 */
export function AchievementIcon({
  achievement,
  className,
}: {
  achievement: Pick<Achievement, "id" | "category">;
  className?: string;
}) {
  switch (achievement.id) {
    case "first_session":
      return <Footprints className={className} aria-hidden />;
    case "streak_7":
      return <Flame className={className} aria-hidden />;
    case "planned_30":
      return <CalendarCheck className={className} aria-hidden />;
    case "streak_100":
      return <ShieldCheck className={className} aria-hidden />;
    case "hours_100":
      return <Timer className={className} aria-hidden />;
    case "weekly_goal":
      return <Target className={className} aria-hidden />;
    case "academic_goal":
      return <Award className={className} aria-hidden />;
    case "collective_25":
      return <Users className={className} aria-hidden />;
    case "ambassador":
      return <UserPlus className={className} aria-hidden />;
    case "level_expert":
      return <Medal className={className} aria-hidden />;
    case "xp_50000":
      return <Crown className={className} aria-hidden />;
    case "league_diamond":
      return <Gem className={className} aria-hidden />;
  }
  switch (achievement.category) {
    case "regularity":
      return <Flame className={className} aria-hidden />;
    case "volume":
      return <Timer className={className} aria-hidden />;
    case "social":
      return <Users className={className} aria-hidden />;
    case "level":
      return <GraduationCap className={className} aria-hidden />;
    default:
      return <Trophy className={className} aria-hidden />;
  }
}
