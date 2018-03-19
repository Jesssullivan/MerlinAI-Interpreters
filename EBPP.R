#Generate sum, mean, and date col. for each day from a table of eBird data
#Packages: not all used, but each are very handy 
library(auk)
library(tidyverse)
library(data.table)
# library(gdata)
options(stringsAsFactors = FALSE)
#Main file, ".../WIWA_filtered.txt" (WIWA = alpha banding code for Wilson's Warbler)"
#wi <- fread("/WIWA_filtered.txt")
##test file : see github repo and README/cloud storage link for test sets, "bad data" files, etc 
#wi <- fread("/subset_test_madeup_2.txt")
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
i <- wiwa_county_pert_2[!(wiwa_county_pert_2[,2] == 0) & !(wiwa_county_pert_2[,2] == "X") ,] 
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
rangenum = 1:numdates
#function meandate calulates the mean observation count for 1 date in the seq. "date366"
meandate <- function(p) {
  obs_individuals_total <- filter(i, `OBSERVATION DATE` == p)
  test <- sum(as.numeric(obs_individuals_total[,2]))
  mean_obs <- test / numdates
  return(mean_obs)
}
mean_x_temp <- sapply(date366, meandate)
mean_tab <- data.frame(mean_x_temp[!(mean_x_temp == "<NA>")])
###write the files somewhere:
#write.csv(mean_tab, "all_averages_wiwa.csv")
#birbscore is out of 10- the following two lines 
##can be done on a "mean_tab" almost any size
###the other alternative will be to bundle birbscores into the mean_tab,
####as opposed to calculating them on the fly
mean_DOI <- mean_tab[date_of_interest,]
max_sp_mean <- max(as.numeric(mean_tab[,1]), na.rm = TRUE)
birbscore <- mean_DOI / max_sp_mean * 10
#print output
print("For...")
print(bird_of_interest)
print(county_name)
print(date_of_interest)
print("The likelihood score out of 10 is:")
print(birbscore)
