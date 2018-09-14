library(tidyverse)
library(data.table)
#Main file, ".../WIWA_filtered.txt" (WIWA = alpha banding code for Wilson's Warbler)"
#wi <- fread("/WIWA_filtered.txt")
wi <- fread("subset_test_madeup_2.txt")
##Define when and where using mm-dd and County
bird_of_interest <- "Starling"
date_of_interest <- "03-03"
county_name <- "Middlesex"
#date range start of calculations
date_wiwa <- "1997-05-18"
# Date formats
wi$`OBSERVATION DATE` <- format(as.Date(wi$`OBSERVATION DATE`), "%m-%d")
date366 <- seq(
  as.Date("01-01", format = "%m-%d"),
  as.Date("12-31", format = "%m-%d"), "days") 
date366 <- format(date366, format = "%m-%d")
#data cleaning 
wi <- wi[!is.na(as.numeric(as.character(wi$`OBSERVATION COUNT`))),]
# lengths for mapply
nameList <- as.character(unique(wi$`COMMON NAME`))
countyList <- as.character(unique(wi$COUNTY))
sumname <- length(nameList)
sumcounty <- length(countyList)
# append birb scores to 366 table
score_add <- function(e,q,w){
  # calculate max value for species/location at any time
  max_df <- data.frame(filter(wi, wi$`COMMON NAME` == nameList[q],
                              wi$COUNTY == countyList[w]))
  max <- max(as.numeric(max_df$OBSERVATION.COUNT))
  # Average section
  avg_df <- filter(wi, wi$`OBSERVATION DATE` == date366[e],
                   wi$`COMMON NAME` == nameList[q],
                   wi$COUNTY == countyList[w])
  average <- mean(as.numeric(avg_df$`OBSERVATION COUNT`))
  # score to be added to df
  birbscore <- as.numeric(average / max) * 10
  df <- data.frame(filter(wi, wi$`OBSERVATION DATE` == date366[e], wi$`COMMON NAME` == nameList[q],
                          wi$COUNTY == countyList[w]))
  df <- c(df, birbscore)
  return(df)
}
# Creates a table with birb score appended - progress
birb_data <- data.frame(mapply(score_add, c(1:365), c(1:sumname), c(1:sumcounty)))
