function populateDateSelect() {
  let dateSelect = document.querySelector('#date-select');

  // Populate with filenames from data/data-by-modzcta-7day
  let dataFilenamesJsonUrl = "https://raw.githubusercontent.com/pitamonster/nyccovid19data/main/data/data-by-modzcta-7day-filepaths.json";
  getJSON( dataFilenamesJsonUrl,
    function(err, data) {
      if (err !== null) {
        console.log(err);
      } else {
        // console.log(data);
        let filenames = data;
        for (let i = 0; i < filenames.length; i++) {
          let filename = filenames[i];

          let selectOption = document.createElement("option");
          selectOption.textContent = dateRageLabelForFilename(filename);
          selectOption.value = filename;          
          dateSelect.appendChild(selectOption);
        }

        handleInputChange();
      }
    }
  );
}

function dateRageLabelForFilename(filename) {
  let dateStr = filename.split("/")[2].slice(0, -20);
  let dateRangeParts = dateStr.split("-");
  let label = `${ monthShortForNum(dateRangeParts[1]) } ${dateRangeParts[2]} - ${ monthShortForNum(dateRangeParts[4]) } ${dateRangeParts[5]} ${dateRangeParts[0]}`;
  return label;
}

function monthShortForNum(monthNumStr) {
  switch (monthNumStr) {
    case "01":
      return "Jan";
    case "02":
      return "Feb";
    case "03":
      return "Mar";
    case "04":
      return "Apr";
    case "05":
      return "May";
    case "06":
      return "Jun";
    case "07":
      return "Jul";
    case "08":
      return "Aug";
    case "09":
      return "Sep";
    case "10":
      return "Oct";
    case "11":
      return "Nov";
    case "12":
      return "Dec";
  }
}

function getJSON(url, callback) {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'json';
  xhr.onload = function() {
    var status = xhr.status;
    if (status === 200) {
      callback(null, xhr.response);
    } else {
      callback(status, xhr.response);
    }
  };
  xhr.send();
};

function addInputEventListeners() {
  let dateSelect = document.querySelector('#date-select');
  dateSelect.addEventListener('change', function (e) {
    handleInputChange(e);
  });

  let dataSelect = document.querySelector('#data-select');
  dataSelect.addEventListener('change', function (e) {
    handleInputChange(e);
  });
}

function handleInputChange(e) {
  let dateSelect = document.querySelector('#date-select');
  let dataSelect = document.querySelector('#data-select');

  createVegaMap(dateSelect.value, dataSelect.value);
}

function createVegaMap(selectedDate, selectedData) {
  // console.log("createVegaMap", selectedDate, selectedData);

  let vegaSpec = buildVegaSpec(selectedDate, selectedData);
  let vegaOptions = {
    "renderer": "svg"
  };

  vegaEmbed('#map', vegaSpec, vegaOptions).then(function (result) {
    // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
    // let viewObj = result.view;
  }).catch(console.error);
}


let zctaShapesFileUrl = "https://raw.githubusercontent.com/pitamonster/nyccovid19data/main/data/zcta/MODZCTA_2010_WGS1984.topo.json";
let zctaPointsFileUrl = "https://raw.githubusercontent.com/pitamonster/nyccovid19data/main/data/zcta/zcta_points.csv";

function buildVegaSpec(selectedDate, selectedData) {


  let params = {};
  params["field"] = selectedData;
  params["dataUrl"] = dataUrlForSelectedOption(selectedDate, selectedData);
  // console.log(params);
  // let dateRangeStr = dateRageLabelForFilename(selectedDate);


  switch (selectedData) {
  case 'COVID_CASE_RATE':
    params["legendTitle"] = `Cases Per 100k`;
    params["fieldUnits"] = "Cases per 100,000";
    params["colorSchemeName"] = "lightgreyred";
    break;
  case 'COVID_CASE_COUNT':
    params["legendTitle"] = `Cases | ${dateRangeStr}`;
    params["fieldUnits"] = "Cases";
    params["colorFill"] = "red";
    params["legendValues"] = [10, 50, 150];
    params["range"] = [0, 600];
    break;
  case 'COVID_DEATH_RATE':
    params["legendTitle"] = `Deaths Per 100k`;
    params["fieldUnits"] = "Deaths per 100,000";
    params["colorSchemeName"] = "lightgreyred";
    break;
  case 'COVID_DEATH_COUNT':
    params["legendTitle"] = `Deaths`;
    params["fieldUnits"] = "Deaths";
    params["colorFill"] = "red";
    params["legendValues"] = [1, 5, 10];
    params["range"] = [0, 250];
    break;
  case 'TEST_RATE':
    params["legendTitle"] = `Tests`;
    params["fieldUnits"] = "Tests";
    params["colorSchemeName"] = "lightgreyteal";
  case 'TOTAL_COVID_TESTS':
    params["legendTitle"] = `Tests Per 100k`;
    params["fieldUnits"] = "Tests per 100,000";
    params["colorFill"] = "teal";
    params["legendValues"] = [10, 50, 150];
    params["range"] = [0, 600];
    break;  
  case "PERCENT_POSITIVE":
    params["legendTitle"] = `Percent Positive`;
    params["fieldUnits"] = "Percent Positive";
    params["colorSchemeName"] = "lightgreyred";
    break;
  case 'POSITIVE_COUNT':
    params["legendTitle"] = `Positive Tests Per 100k`;
    params["fieldUnits"] = "Positive Tests per 100,000";
    params["colorFill"] = "red";
    params["legendValues"] = [10, 50, 150];
    params["range"] = [0, 600];
    break;
  default:
    params["legendTitle"] = `Cases Per 100k`;
    params["fieldUnits"] = "Cases per 100,000";
    params["colorSchemeName"] = "lightgreyred";
  }


  return vegaSpecForParams(params);
}


function dataUrlForSelectedOption(selectedDate, selectedData) {
  var dataUrl;

  dataUrl = `https://raw.githubusercontent.com/pitamonster/nyccovid19data/main/${ selectedDate }`;

  return dataUrl;
}


function vegaSpecForParams(params) {

  var spec;

  if ( ["COVID_CASE_RATE", "COVID_DEATH_RATE", "TEST_RATE", "PERCENT_POSITIVE"].includes(params["field"]) ) {

    spec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "width": "container",
      "height": "container",
      "autosize": {
        "type": "fit",
        "contains": "padding"
      },
      "layer": [{
        "data": {
          "url": zctaShapesFileUrl,
          "format": {
            "type": "topojson",
            "feature": "collection"
          }
        },
        "mark": {
          "type": "geoshape",
          "stroke": "#ffffff",
          "fill": "lightgray"
        }
      }, {
        "data": {
          "url": zctaShapesFileUrl,
          "format": {
            "type": "topojson",
            "feature": "collection"
          }
        },
        "transform": [{
          "lookup": "properties.MODZCTA",
          "from": {
            "data": {
              "url": params["dataUrl"]
            },
            "key": "MODIFIED_ZCTA",
            "fields": ["MODIFIED_ZCTA", params["field"], "NEIGHBORHOOD_NAME"]
          }
        }],
        "mark": {
          "type": "geoshape",
          "stroke": "#FFFFFF"
        },
        "encoding": {
          "color": {
            "bin": false,
            "field": params["field"],
            "type": "quantitative",
            "scale": {
              "scheme": {
                "name": params["colorSchemeName"],
                "extent": [0.2, 1.25]
              }
            },
            "legend": {
              "title": params["legendTitle"],
              "titleFontSize": 10,
              "orient": "top-left",
              "gradientLength": 100
            }
          },
          "strokeWidth": {
            "condition": [],
            "value": 0.5
          },
          "tooltip": [{
              "field": "properties.label",
              "type": "nominal",
              "title": "ZIP Code"
            },
            {
              "field": "NEIGHBORHOOD_NAME",
              "type": "nominal",
              "title": "Neighborhood"
            },
            {
              "field": params["field"],
              "type": "quantitative",
              "title": params["fieldUnits"]
            }
          ]
        }
      }]
    };
  } else if ( ["COVID_CASE_COUNT", "COVID_DEATH_COUNT", "TOTAL_COVID_TESTS", "POSITIVE_COUNT"].includes(params["field"]) ) {

    spec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "width": "container",
      "height": "container",
      "autosize": {
        "type": "fit",
        "contains": "padding"
      },
      "layer": [{
        "data": {
          "url": zctaShapesFileUrl,
          "format": {
            "type": "topojson",
            "feature": "collection"
          }
        },
        "mark": {
          "type": "geoshape",
          "stroke": "#ffffff",
          "fill": "lightgray"
        }
      }, {
        "data": {
          "url": zctaPointsFileUrl
        },
        "transform": [{
          "lookup": "MODZCTA",
          "from": {
            "data": {
              "url": params["dataUrl"]
            },
            "key": "MODIFIED_ZCTA",
            "fields": [
              "MODIFIED_ZCTA",
              "NEIGHBORHOOD_NAME",
              params["field"]
            ]
          },
          "default": "no data"
        }],
        "mark": {
          "type": "circle",
          "stroke": "#8A2BE2",
          "fill": params["colorFill"],
          "fillOpacity": 0.5
        },
        "encoding": {
          "latitude": {
            "field": "lat",
            "type": "quantitative"
          },
          "longitude": {
            "field": "lon",
            "type": "quantitative"
          },
          "size": {
            "bin": false,
            "field": params["field"],
            "type": "quantitative",
            "scale": {
              "range": params["range"]
            },
            "legend": {
              "title": params["legendTitle"],
              "titleFontSize": 10,
              "orient": "top-left",
              "symbolLimit": 5,
              "symbolOpacity": 0.5,
              "values": params["legendValues"]
            }
          },
          "strokeWidth": {
            "value": 0.5
          },
          "tooltip": [{
              "field": "MODIFIED_ZCTA",
              "type": "nominal",
              "title": "ZIP Code"
            },
            {
              "field": "NEIGHBORHOOD_NAME",
              "type": "nominal",
              "title": "Neighborhood"
            },
            {
              "field": params["field"],
              "type": "quantitative",
              "title": params["fieldUnits"]
            }
          ]
        }
      }]
    };
  }

  return spec;
}


function initPage() {
  populateDateSelect();
  addInputEventListeners();
}


initPage();
