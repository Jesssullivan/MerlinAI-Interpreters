library(data.table)
library(tidyverse)
data <-
  fread("subset_test_madeup_2.txt")
#List processing
Birds_list <- c(unique(data$`COMMON NAME`))
lengthbirds <- as.numeric(length(Birds_list))
county_list <- c(unique(data$COUNTY))
lengthcounty <- as.numeric(length(county_list))
date_list <- c(data$`OBSERVATION DATE`)
lengthdates <- as.numeric(length(date_list))
#date processing
begin_date <- "1997-05-18"
end_date <- "2018-01-01"
date366 <- format(seq(
  as.Date("0000-01-01", format = "%Y-%m-%d"),
  as.Date("0000-12-31", format = "%Y-%m-%d"),
  "days"
), format = "%m-%d")
#data filtering
data_filtered <- data[!(data$`OBSERVATION COUNT` == 0) &
                        !(data$`OBSERVATION COUNT` == "X") ,]
date_list_filtered <- as.Date(data_filtered$`OBSERVATION DATE`)
data_filtered$`OBSERVATION DATE` <-
  format(as.Date(data_filtered$`OBSERVATION DATE`), format = "%m-%d")
#make some temporary/loop variables
l <- vector("list")
result <- vector("list", 2)
r = 0
t = 0
i = 1
z = 0
#grid combo creation for sizing and keeping the output sparkly fresh
wxyz <- expand.grid(Birds_list, county_list, date366, stringsAsFactors = TRUE)
#generates content for "mean_tab" 
Mean_Func <- function(q,w) {
  for (e in wxyz$Var3) {
    r <- 0
    r <- data_filtered %>% filter(`COMMON NAME` == q)
    r <- r %>% filter(COUNTY == w)
    r <- r %>% filter(`OBSERVATION DATE` == e)
    t <- as.numeric(r[,3])
    y <- sum(t / lengthdates)
    result[[i]] <- c(y,r,q,w)
    i = i + 1
    print(e)
    if (e == "12-29")
        return(result)
  }
}
Mean_data <- matrix(mapply(Mean_Func, Birds_list, county_list))
mean_tab <- as.table(Mean_data)
#write.csv(mean_tab, "......mean_tab.csv")
