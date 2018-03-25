library(auk)
library(tidyverse)
library(data.table)
#Main file, "/WIWA_filtered.txt" (WIWA = alpha banding code for Wilson's Warbler)"
wiwa <- fread(".../WIWA_filtered.txt")
#Define when and where using mm-dd and County
date_wiwa <- ("1997-05-18")
county_name <- ("Middlesex")
wiwa_county <- wiwa %>% filter(COUNTY == county_name)
wiwa_county_pert_2 <- cbind(wiwa_county %>% select("OBSERVATION DATE", "OBSERVATION COUNT"))
wiwa_county_pert_2$`OBSERVATION COUNT` <- gsub("X", 0, wiwa_county_pert_2$`OBSERVATION COUNT`)
i <- wiwa_county_pert_2[!(wiwa_county_pert_2[2] == 0),]
dates <- seq(as.Date(date_wiwa), as.Date("2018-01-01"), "years")
iii <- as.numeric(count(i))
test = 0
range = 1:iii
obs_individuals_total = 0
num_obs_instances = 0
repeat {
  for(p in range) {
    ifelse(i[test[range],1] %in% as.character(dates), {
      obs_individuals_total <- data.frame(as.numeric(i[test,2]) + obs_individuals_total)
      num_obs_instances <- data.frame(as.numeric(num_obs_instances[1] + 1))
    } , 
    test <- test+1) }
  if (test >= iii) print("done!") & break 
}
#Show the following
num_obs_instances
obs_individuals_total
