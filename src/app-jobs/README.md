# This is a preview to the cron jobs micro-app used to handle cron jobs.

This micro-app is a bit different from the general structure of other micro-apps inside the project.
It is not based on the classic structure with controller and services, as the main puropse is to offer the service of crones.

You can write the logic you want to perform inside a function you declare in `jobs.service.ts` file,
and define when you want the crone job to run, using the @Cron decorator, or @Interval decorator above the function.
