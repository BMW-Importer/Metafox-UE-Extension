/*
* <license header>
*/

import {
  Button,
  Divider,
  Flex,
  Form,
  Heading,
  Item,
  Picker,
  ProgressCircle,
  Provider,
  TextField,
  View,
  lightTheme,
} from "@adobe/react-spectrum";
import { attach } from "@adobe/uix-guest";
import React, { useEffect, useState } from "react";
import axios from 'axios';

import FileGear from "@spectrum-icons/workflow/FileGear";
import actions from "../config.json";
import { priConExtensionId,SERIES,MARKET_SEGMENT } from "./Constants";

const PRECON_MODEL_API_URL = `https://productdata.api.bmw/pdh/precons/v1.0/${SERIES}/${MARKET_SEGMENT}`;
export default function () {
  const [guestConnection, setGuestConnection] = useState();
  const [loading, setLoading] = useState(true);
  const [headers, setHeaders] = useState();
  const [path, setPath] = useState("");
  const [savingInProgress, setSavingInProgress] = useState(false);

  const [carSerieses, setCarSerieses] = useState([]);
  const [selectedCarSeries, setSelectedCarSeries] = useState();

  const [seriesCode,setSeriesCode]= useState();

  const [modelRangeData,setModelRangeData]= useState([]);
  const [selectedCarModelRange, setSelectedCarModelRange] = useState();


  const onCarSeriesChangeHandler = (value) => {
    console.log("onChange on extension side", value);
    setSelectedCarSeries(value);
    setSeriesCode(value);
    guestConnection?.host?.field.onChange(value);
  };
  
  const onCarModelRangeChangeHandler = (value) => {
    setModelRangeData(value);
    setSelectedCarModelRange(value);
    guestConnection?.host?.field.onChange(value)
  };
  //modelrange
  const URL = `https://productdata.api.bmw/pdh/precons/v1.0/ranges/${MARKET_SEGMENT}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(PRECON_MODEL_API_URL);
        const data = await response.json();
        console.log(data);
        
        const seriesCodes = Object.values(data).map(item => item.seriesCode);
        setCarSerieses(Object.values(seriesCodes));
        
        seriesCodes?.map((item) => setSeriesCode(item?.seriesCode));

        const connection = await attach({ id: priConExtensionId });
        setGuestConnection(connection);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  //modelrange

  useEffect(() => {
    const fetchModelRange = async () => {
      console.log(seriesCode);
      if (!seriesCode) return;
      try {
        const modelDetailUrl = `${URL}/${seriesCode}`;
        const modelDetailResponse = await axios.get(modelDetailUrl);
        console.log(modelDetailResponse);
        const modelDetail = modelDetailResponse?.data;
        const rangeCode = Object.values(modelDetail).map(item => item.modelRangeCode);
        setModelRangeData(Object.values(rangeCode));
        
      } catch (error) {
        console.error('Error fetching details for model', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModelRange();
  }, [seriesCode]);

  useEffect(() =>{
    if (modelRangeData.length > 0) {
      setSelectedCarModelRange(modelRangeData);
    }
    console.log(modelRangeData);
}, [modelRangeData]);

  return (
    <Provider theme={lightTheme} colorScheme="light">
      <Flex direction="column">
        <Form isHidden={loading}>
          <Picker
            label="Car Series"
            necessityIndicator="label"
            onSelectionChange={onCarSeriesChangeHandler}
            placeholder="Select a series"
            selectedKey={selectedCarSeries}
            isRequired
          >
            {carSerieses.map((item) => (
              <Item key={item} value={item}>{item}</Item>
            ))}
          </Picker>
          <Picker
            label="Car Model"
            necessityIndicator="label"
            onSelectionChange={onCarModelRangeChangeHandler}
            placeholder="Select a model"
            isRequired
            selectedKey={selectedCarModelRange}
          >
            {selectedCarModelRange?.map((rangeCode) => (
              <Item key={rangeCode}>{rangeCode}</Item>
            ))}
          </Picker>
        </Form>
        <View isHidden={!loading}>
          <Flex
            direction="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            gap={"size-200"}
          >
            <ProgressCircle size="L" aria-label="Loading..." isIndeterminate />
            <i>Loading...</i>
          </Flex>
        </View>
      </Flex>{" "}
    </Provider>
  );
}