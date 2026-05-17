import { Course } from "@/api/types";

const DAY_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function toTimeStr(date: Date): string {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}:00`;
}

export function matchCourseByTime(courses: Course[], date: Date): Course | null {
    const dayOfWeek = DAY_OF_WEEK[date.getDay()];
    const timeStr = toTimeStr(date);

    for (const course of courses) {
        for (const sched of course.schedules) {
            if (
                sched.dayOfWeek === dayOfWeek &&
                timeStr >= sched.startTime &&
                timeStr <= sched.endTime
            ) {
                return course;
            }
        }
    }
    return null;
}
