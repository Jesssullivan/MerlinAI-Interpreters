#Generate sum, mean, and date col. for each day from a table of eBird data
#Packages: not all used, but each are very handy 
library(auk)
library(tidyverse)
library(data.table)
library(gdata)
options(stringsAsFactors = FALSE)
#Main file, ".../WIWA_filtered.txt" (WIWA = alpha banding code for Wilson's Warbler)"
wi <- fread(".../WIWA_filtered.txt")
##test file : see github repo and README/cloud storage link for test sets, "bad data" files, etc 
#wi <- fread(".../subset_test_madeup_starz.txt")
##Define when and where using mm-dd and County
bird_of_interest <- "Wilson's Warbler"
date_of_interest <- "05-18"
county_name <- "Middlesex"
#date range start of calculations
date_wiwa <- "1997-05-18"
#core vectors: remove "year" in date, calculate some sums and do basic filtering/data cleaning
wi_county <- wi %>% filter(COUNTY == county_name)
wiwa <- wi %>% filter(`COMMON NAME` == bird_of_interest)
wiwa_county <- wiwa %>% filter(COUNTY == county_name)
wiwa_county_pert_2 <- wiwa_county %>% select("OBSERVATION DATE", "OBSERVATION COUNT")
dates <- seq(as.Date(date_wiwa), as.Date("2018-01-01"), "years")
datesdays <- seq(as.Date(date_wiwa), as.Date("2018-01-01"), "days")
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
mean_tab = 0
numdates = as.numeric(numdates)
rangenum = 1:numdates
#function meandate calulates the mean observation count for 1 date in the seq. "date366"
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
#Generated sum, mean, and date col. for each day 
#Preform a similar function for only the day_of_interest:
daydate <- function(p) {
  repeat {
    {
      ifelse(as.character(i[1:numdates,1]) == p, {
        obs_individuals_total <- as.numeric(i[1:numdates,2]) + obs_individuals_total
      } ,
      print("working..."))
    }
    mean_obs <- obs_individuals_total / numdates
    break 
  }
  return(mean_obs)
}
#apply meandate to each day of the year:
mean_x_temp <- sapply(date366, meandate)
mean_tab <- data.frame(mean_x_temp[!(mean_x_temp == "<NA>")])
#apply daydate to our date_of_interest:
DofI_mean_obs <- sapply(date_of_interest, daydate)
###write the files somewhere:
#write.csv(mean_tab, "...all_averages.csv")
#write.csv(DofI_mean_obs, "...day_average.csv")
max_sp_mean <- max(as.numeric(mean_tab[2,]), na.rm = TRUE)
mean_DOI <- mean(DofI_mean_obs, na.rm = TRUE)
#end birb score out of 1000, "possible points" 
#(makes it easier I think to interpret as a human), normalized:
birbscore <- mean_DOI / max_sp_mean * 1000
print("For...")
print(bird_of_interest)
print("The likelihood (out of 1000 possible points) of seeing this bird in...")
print(county_name)
print("on...")
print(date_of_interest)
print("is:")
print(birbscore)