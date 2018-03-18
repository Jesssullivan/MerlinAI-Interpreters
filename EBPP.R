#Generate sum, mean, and date col. for each day from a table of eBird data
#Packages: not all used, but each are very handy 
library(auk)
library(tidyverse)
library(data.table)
library(gdata)
options(stringsAsFactors = FALSE)
#Main file, "/WIWA_filtered.txt" (WIWA = alpha banding code for Wilson's Warbler)"
wi <- fread("...EBPP/WIWA_filtered.txt")
##test file
#wi <- fread("...subset_test_madeup.txt")
#Define when and where using mm-dd and County
date_of_interest <- "05-18"
#date range start
date_wiwa <- "1997-05-18"
county_name <- "Middlesex"
#core vectors: remove "year" in date, calculate some sums and do basic filtering/data cleaning
wiwa <- wi %>% filter(`COMMON NAME` == "Wilson's Warbler")
wiwa_county <- wiwa %>% filter(COUNTY == county_name)
wiwa_county_pert_2 <- wiwa_county %>% select("OBSERVATION DATE", "OBSERVATION COUNT")
dates <- seq(as.Date(date_wiwa), as.Date("2018-01-01"), "years")
numdates <- length(dates)
numdays <- length(datesdays)
rangedays = 1:numdays
date366 <- seq(
  as.Date("0000-01-01", format = "%Y-%m-%d"),
  as.Date("0000-12-31", format = "%Y-%m-%d"), "days") 
date366 <- format(date366, format = "%m-%d")
i <- wiwa_county_pert_2[!(wiwa_county_pert_2[2] == 0) & !(wiwa_county_pert_2[2] == "X") ,] 
iii <- as.numeric(count(i[2]))
list_dates <- as.Date(i[,1])
idates <- format(list_dates, "%m-%d")
i$`OBSERVATION DATE` <- idates
range = 1:iii
#meandate variables
test = 1
obs_individuals_total = 0
mean_obs = 0
mean_x = 0
numdates = as.numeric(numdates)
rangenum = 1:numdates
#function mean date calulates the mean observation count for 1 date in the seq. "date366"
meandate <- function(p) {
  repeat {
    {
      ifelse(as.character(i[1:numdates,1]) == p, {
        obs_individuals_total <- as.numeric(i[1:numdates,2]) + obs_individuals_total
      } ,
      print("working..."))
      }
    mean_obs <- obs_individuals_total / numdates
    mean_x <- rbind(obs_individuals_total, mean_obs, p)
    break 
  }
  return(mean_x)
}
#Generate sum, mean, and date col. for each day 
x <- sapply(date366, meandate)
xy <- data.frame(x[!(x == "<NA>")])
#write the files somewhere:
#write.csv(x, "...tada.csv")
#write.csv(xy, "...all_averages.csv")
max_sp_mean <- max(as.numeric(xy[2,]))
DOI <- xy[date_of_interest,]
DOI <- as.numeric(xy[2,])
#end birb score out of 1000, "possible points" 
#(makes it easier I think to interpret as a human), normalized:
mean_DOI <- mean(DOI)
birbscore <- mean_DOI / max_sp_mean * 1000
print(birbscore)
