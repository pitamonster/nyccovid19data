function addInputEventListener() {
  let select = document.querySelector('select');
  select.addEventListener('change', function (e) {
    handleInputChange(e);
  });
}

function handleInputChange(e) {
  console.log(e.target.value);
  createVegaMapForSelectedOption(e.target.value);
}

function createVegaMapForSelectedOption(selectedOption) {
  let vegaSpec = vegaSpecForSelectedOption(selectedOption);
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

function vegaSpecForSelectedOption(selectedOption) {

  let params = {};
  params["field"] = selectedOption;
  params["dataUrl"] = dataUrlForSelectedOption(selectedOption);


  switch (selectedOption) {
  case 'COVID_CASE_RATE_4WEEK':
    params["legendTitle"] = "Cases Per 100k | Last 28 Days";
    params["fieldUnits"] = "Cases per 100,000";
    params["colorSchemeName"] = "lightgreyred";
    break;
  case 'COVID_CASE_COUNT_4WEEK':
    params["legendTitle"] = "Cases | Last 28 Days";
    params["fieldUnits"] = "Cases";
    params["colorFill"] = "red";
    params["legendValues"] = [10, 50, 150];
    params["range"] = [0, 600];
    break;
  case 'COVID_DEATH_RATE_4WEEK':
    params["legendTitle"] = "Deaths Per 100k | Last 28 Days";
    params["fieldUnits"] = "Deaths per 100,000";
    params["colorSchemeName"] = "lightgreyred";
    break;
  case 'COVID_DEATH_COUNT_4WEEK':
    params["legendTitle"] = "Deaths | Last 28 Days";
    params["fieldUnits"] = "Deaths";
    params["colorFill"] = "red";
    params["legendValues"] = [1, 5, 10];
    params["range"] = [0, 250];
    break;
  case 'TESTING_RATE_4WEEK':
    params["legendTitle"] = "Tests | Last 28 Days";
    params["fieldUnits"] = "Tests";
    params["colorSchemeName"] = "lightgreyteal";
  case 'NUM_PEOP_TEST_4WEEK':
    params["legendTitle"] = "Tests Per 100k | Last 28 Days";
    params["fieldUnits"] = "Tests per 100,000";
    params["colorFill"] = "teal";
    params["legendValues"] = [10, 50, 150];
    params["range"] = [0, 600];
    break;  
  case "PERCENT_POSITIVE_4WEEK":
    params["legendTitle"] = "Percent Positive | Last 28 Days";
    params["fieldUnits"] = "Percent Positive";
    params["colorSchemeName"] = "lightgreyred";
    break;
  default:
    params["field"] = "COVID_CASE_RATE_4WEEK";
    params["dataUrl"] = dataUrlForSelectedOption("COVID_CASE_RATE_4WEEK");
    params["legendTitle"] = "Cases Per 100k | Last 28 Days";
    params["fieldUnits"] = "Cases per 100,000";
    params["colorSchemeName"] = "lightgreyred";
  }


  return vegaSpecForParams(params);
}

function dataUrlForSelectedOption(selectedOption) {
  var dataUrl;

  if ( selectedOption.includes("4WEEK") ) {
    dataUrl = "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/recent/recent-4-week-by-modzcta.csv";
  }

  return dataUrl;
}

function vegaSpecForParams(params) {

  var spec;

  if ( ["COVID_CASE_RATE_4WEEK", "COVID_DEATH_RATE_4WEEK", "TESTING_RATE_4WEEK", "PERCENT_POSITIVE_4WEEK"].includes(params["field"]) ) {

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
  } else if ( ["COVID_CASE_COUNT_4WEEK", "COVID_DEATH_COUNT_4WEEK", "NUM_PEOP_TEST_4WEEK"].includes(params["field"]) ) {

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
  let select = document.querySelector('select');
  createVegaMapForSelectedOption(select.value || 'COVID_CASE_RATE_4WEEK');

  addInputEventListener();
}


initPage();
