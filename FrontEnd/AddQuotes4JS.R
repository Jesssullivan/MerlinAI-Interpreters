setwd("~/Downloads")
file = "book1.csv"
df <- read.csv(file)
length(df[,1])
list <- data.frame("output",stringsAsFactors = FALSE)
i <- 1
df[3,4]
for(i in 1:as.numeric(length(df[,1]))){
  r <- formatC(df[i,4], width = 3, format = "d", flag = "0")
  ro <- paste('"', df[i,2], df[i,3],r, sep = "")
  row <- paste(ro, df[i,5], '",', sep = "")
    list <- rbind(row, list)
    #print(list)
#    if (i == 10)
#      break
}
write.csv(list, "output_Ccode5.csv")
