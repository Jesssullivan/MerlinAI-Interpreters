library(data.table)
library(tidyverse)
library(stringr)
library(RMySQL) 
setwd("E:")
# raw ebd data:
file <- "ebd_relMay-2018.txt"
inputFile <- file("ebd_obj.txt")
data_file <- "entry_out_full.csv"
# species = X5
# county = X17
# Observation Date = X28
# callback processes data from iterate "dat" and writes it to a large file for the next step
callback <- function(dat, x) {
  # format data string to data frame 
  data <- data.frame(t(data.frame(str_split(as.character(dat), "\t"))), stringsAsFactors = FALSE)
  entry <- data.frame(cbind(data$X5, data$X17, data$X28))  # need to add state field
  # write to a large (growing) file: 
  write_csv(entry, data_file, append = TRUE)
  #dbAppendTable(connected,"table1", data.frame(push.data))
  print(entry)
}
iterate <- function() {
  while (length(dat <- as.character(readLines(file, n = 1, warn = FALSE)))  > 0 ) {
      dat <- read_lines_chunked(file, callback, chunk_size = 1)
  }
}
# List dates
date366 <- seq(
  as.Date("01-01", format = "%m-%d"),
  as.Date("12-31", format = "%m-%d"), "days") 
date366 <- format(date366, format = "%m-%d")
# mean_callback filters by date i out of 365, with the idea
# going at a table for every day of the year
# perhaps doing some score calc in sql is a better idea??
i <- 1
mean_callback <- function (dat, x) {
  data <- data.frame(str_split(dat, ",", simplify = TRUE))
  date_day <- format(as.Date(data[,3], format = "%Y-%m-%d"), format = "%m-%d")
  ifelse(date_day == date366[i], {
    print("match")
    write_csv(data, "table_1.csv", append = TRUE)
    }, paste0("no match"))
}
# iterate over "data_file" 
mean_func <- function() {
  while (length(dat <- as.character(readLines(file, n = 1, warn = FALSE)))  > 0 ) {
    dat <- read_lines_chunked(data_file, mean_callback, chunk_size = 1)
  }
}
mean_func()








