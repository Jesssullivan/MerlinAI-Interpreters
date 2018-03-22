#Generate sum, mean, and date col. for each day from a table of eBird data
library(tidyverse)
library(data.table)
data <- fread("/subset_test_madeup_2.txt")
begin_date <- "1997-05-18"
end_date <- "2018-01-01"
years <- seq(as.Date(begin_date), 
             as.Date(end_date), "years")
#List processing
Birds_list <- c(unique(data$`COMMON NAME`))
lengthbirds <- as.numeric(length(Birds_list))
county_list <- c(unique(data$COUNTY))
lengthcounty <- as.numeric(length(county_list))
date_list <- c(data$`OBSERVATION DATE`)
lengthdates <- as.numeric(length(date_list))
#date processing
date366 <- format(seq(
  as.Date("0000-01-01", format = "%Y-%m-%d"),
  as.Date("0000-12-31", format = "%Y-%m-%d"),
  "days"), format = "%m-%d")
data_filtered <- data[!(data$`OBSERVATION COUNT` == 0) &
         !(data$`OBSERVATION COUNT` == "X") , ]
date_list_filtered <- as.Date(data_filtered$`OBSERVATION DATE`)
data_filtered$`OBSERVATION DATE` <-
  format(as.Date(data_filtered$`OBSERVATION DATE`), format = "%m-%d")
num_dates <- as.numeric(length(years))
#create some future variables
num_observed = 0
obs = 0
q = 0
w = 0
e = 0
r = 0
t = 0
y = 0
#doing things in global env. to remove any confusion with apply functions (thats another ball of wax)
## Exuse the arbitrary "qwerty" var. names
q = Birds_list 
w = county_list
e = date366
#This makes the the existing data into factors/lists.  It accounts for repeats in data with minimal effort-- 
##- I do not think it is key however 
xyz <-expand.grid(Birds_list, county_list, date366, stringsAsFactors = TRUE)
#Bulk_Func <- function(q, w, e) {
for (q in xyz$Var1) {
  for (w in xyz$Var2) {
    for (e in xyz$Var3) {
      r <- data_filtered %>% filter(`COMMON NAME` == q)
      r <- r %>% filter(COUNTY == w)
      r <- r %>% filter(`OBSERVATION DATE` == e)
      t <- as.numeric(r[, 3])
      y <- t / lengthdates
      print(y)
      print(e)
      if (e == "01-21") return(y)
    }
  }
}
#this is producing numbers, but is not returning them.  See print(y).  Goal is to
## output average "y" with date, county, species data together to make finding it later more possible.
###perhaps do the final birbscore in with them too, if the variables end up getting put together 

##not here yet
batch_output <- data.frame(mapply(Bulk_Func, Birds_list, county_list, date366))