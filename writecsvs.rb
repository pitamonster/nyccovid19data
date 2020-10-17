# Generate positive rate seven day average csvs
# 
require "time"
require "csv"
require "json"
require "pp"




datadirpath = "data/nychealth-coronavirus-data/data-by-modzcta"
filepaths = Dir["#{ datadirpath }/*"]
test_counts_started_on = Time.parse("2020-06-09")


filepathsbydates = {}
filepaths.map{|filepath|
	date = Time.parse(filepath.split("/").last.split("T").first)
	filepathsbydates[date] = filepath if date >= test_counts_started_on
}
filepathsbydates = Hash[filepathsbydates.sort]


period = 7
zctas = []
dates = filepathsbydates.keys
destFilepaths = []


dates.each_with_index do |date, i|
	next if i < period
	date0 = dates[i-period]
	# next if date - date0 > ( 7 * 24 * 60 * 60 )
	puts "[#{i}][#{date}]"
	filepath0 = filepathsbydates[date0]
	filepath1 = filepathsbydates[date]

	rows_initial = CSV.read(filepath0)
	rows_final = CSV.read(filepath1)

	dateInitialStr = date0.utc.iso8601.split("T").first
	dateFinalStr = date.utc.iso8601.split("T").first

	destFilepath = "data/data-by-modzcta-#{period}day/#{dateInitialStr}-#{dateFinalStr}-data-by-modzcta.csv"
	destFilepaths = destFilepaths.push(destFilepath)

	csv = CSV.open(destFilepath, "wb")
	csv << rows_initial[0] + ["TEST_RATE", "POSITIVE_COUNT"]
	# Column headers
	# [
	# 	"MODIFIED_ZCTA",
	# 	"NEIGHBORHOOD_NAME",
	# 	"BOROUGH_GROUP",
	# 	"COVID_CASE_COUNT",
	# 	"COVID_CASE_RATE",
	# 	"POP_DENOMINATOR",
	# 	"COVID_DEATH_COUNT",
	# 	"COVID_DEATH_RATE",
	# 	"PERCENT_POSITIVE",
	# 	"TOTAL_COVID_TESTS",
	# 	"TEST_RATE",
	# 	"POSITIVE_COUNT"
	# ]


	bighash = {}

	rows_initial.each_with_index do |row, j|
		next if j==0
		# pp row
		zcta = row[0]
		bighash[zcta] = {} if bighash[zcta].nil?
		zctas = zctas.push(zcta) if !zctas.include?(zcta)


		bighash[zcta]["case_count_initial"] = !row[3]&.empty? ? row[3].to_i : nil
		bighash[zcta]["case_rate_initial"] = !row[4]&.empty? ? row[4].to_f : nil
		bighash[zcta]["death_count_initial"] = !row[6]&.empty? ? row[6].to_i : nil
		bighash[zcta]["death_rate_initial"] = !row[7]&.empty? ? row[7].to_f : nil
		bighash[zcta]["positive_rate_initial"] = !row[8]&.empty? ? row[8].to_f : nil
		bighash[zcta]["test_count_initial"] = !row[9]&.empty? ? row[9].to_i : nil
		if bighash[zcta]["positive_rate_initial"] && bighash[zcta]["test_count_initial"]
			bighash[zcta]["positive_count_initial"] = (0.01 * bighash[zcta]["positive_rate_initial"] * bighash[zcta]["test_count_initial"]).round
		end		
	end

	rows_final.each_with_index do |row, j|
		next if j==0
		# pp row
		zcta = row[0]
		bighash[zcta] = {} if bighash[zcta].nil?
		zctas = zctas.push(zcta) if !zctas.include?(zcta)


		bighash[zcta]["case_count_final"] = !row[3]&.empty? ? row[3].to_i : nil
		bighash[zcta]["case_rate_final"] = !row[4]&.empty? ? row[4].to_f : nil
		bighash[zcta]["death_count_final"] = !row[6]&.empty? ? row[6].to_i : nil
		bighash[zcta]["death_rate_final"] = !row[7]&.empty? ? row[7].to_f : nil
		bighash[zcta]["positive_rate_final"] = !row[8]&.empty? ? row[8].to_f : nil
		bighash[zcta]["test_count_final"] = !row[9]&.empty? ? row[9].to_i : nil
		if bighash[zcta]["positive_rate_final"] && bighash[zcta]["test_count_final"]
			bighash[zcta]["positive_count_final"] = (0.01 * bighash[zcta]["positive_rate_final"] * bighash[zcta]["test_count_final"]).round
		end

		bighash[zcta]["modified_zcta"] = zcta
		bighash[zcta]["neighborhood_group"] = row[1]
		bighash[zcta]["borough_group"] = row[2]
		bighash[zcta]["population"] = row[5]&.to_f

		# pp bighash[zcta]
	end


	zctas.each do |zcta|
		next if bighash[zcta].nil?

		if bighash[zcta]["case_count_final"] && bighash[zcta]["case_count_initial"]
			bighash[zcta]["case_count_delta"] = bighash[zcta]["case_count_final"] - bighash[zcta]["case_count_initial"]
		end
		if bighash[zcta]["case_count_delta"] && bighash[zcta]["population"]
			bighash[zcta]["case_rate"] = 100000.0 * bighash[zcta]["case_count_delta"].to_f / bighash[zcta]["population"]
		end
		if bighash[zcta]["death_count_final"] && bighash[zcta]["death_count_initial"]
			bighash[zcta]["death_count_delta"] = bighash[zcta]["death_count_final"] - bighash[zcta]["death_count_initial"]
		end
		if bighash[zcta]["death_count_delta"] && bighash[zcta]["population"]
			bighash[zcta]["death_rate"] = 100000.0 * bighash[zcta]["death_count_delta"].to_f / bighash[zcta]["population"]
		end
		if bighash[zcta]["test_count_final"] && bighash[zcta]["test_count_initial"]
			bighash[zcta]["test_count_delta"] = bighash[zcta]["test_count_final"] - bighash[zcta]["test_count_initial"]
		end
		if bighash[zcta]["test_count_delta"] && bighash[zcta]["population"]
			bighash[zcta]["test_rate"] = 100000.0 * bighash[zcta]["test_count_delta"].to_f / bighash[zcta]["population"]
		end
		if bighash[zcta]["positive_count_final"] && bighash[zcta]["positive_count_initial"]
			bighash[zcta]["positive_count_delta"] = bighash[zcta]["positive_count_final"] - bighash[zcta]["positive_count_initial"]
		end
		if bighash[zcta]["positive_count_delta"] && bighash[zcta]["population"]
			bighash[zcta]["positive_rate"] = 100.0 * bighash[zcta]["positive_count_delta"].to_f / bighash[zcta]["test_count_delta"].to_f
		end

	  csv << [
	  	bighash[zcta]["modified_zcta"],
		  bighash[zcta]["neighborhood_group"],
		  bighash[zcta]["borough_group"],
	  	bighash[zcta]["case_count_delta"],
	  	bighash[zcta]["case_rate"]&.round(2),            # cases per 100000 population
	  	bighash[zcta]["population"],
	  	bighash[zcta]["death_count_delta"],
	  	bighash[zcta]["death_rate"]&.round(2),	         # deaths per 100000 population
	  	bighash[zcta]["positive_rate"]&.round(2),        # percent positive tests
	  	bighash[zcta]["test_count_delta"],
	  	bighash[zcta]["test_rate"]&.round(2),            # tests per 100000 population
	  	bighash[zcta]["positive_count_delta"]
	  ]
	end

end




File.open("data/data-by-modzcta-#{period}day-filepaths.json", "wb") do |f|
  f << JSON.pretty_generate(destFilepaths.reverse)
end

