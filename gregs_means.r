library(tidyverse)
library(data.table)
data <- fread("subset_test_madeup_2.txt")

common_names <- unique(data[,'COMMON NAME'])
counties <- unique(data[,'COUNTY'])

# day is in [1..366] (includes Feb. 29)
mean_count_county_species_day <- function(county, species, day) {
    filtered <- data %>%
        filter(COUNTY == county) %>%
        filter(`COMMON NAME` == species) %>%
        filter(as.integer(strftime(`OBSERVATION DATE`, "%j")) == day)
    mean(as.integer(filtered$`OBSERVATION COUNT`))
}
                       


# mean_count_county_species_day("Middlesex", "Wilson's Warbler", 66)
