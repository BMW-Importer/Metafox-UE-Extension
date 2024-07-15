/*
* <license header>
*/

import {
  Flex,
  Form,
  Item,
  Picker,
  ProgressCircle,
  Provider,
  View,
  lightTheme,
} from "@adobe/react-spectrum";
import { attach } from "@adobe/uix-guest";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { priConExtensionId, SERIES, RANGE, VEHICLES, PRECON_BASE_URL, VEHICLE } from "./Constants";
import actions from '../config.json';

export default function () {
  const [guestConnection, setGuestConnection] = useState();
  const [loading, setLoading] = useState(true);

  const [carSerieses, setCarSerieses] = useState([]);
  const [selectedCarSeries, setSelectedCarSeries] = useState('');

  const [seriesCode, setSeriesCode] = useState('');
  const [rangeCode, setRangeCode] = useState('');
  const [preconId, setPreconId] = useState([]);


  const [carModelRange, setCarModelRange] = useState([]);
  const [selectedCarModelRange, setSelectedCarModelRange] = useState('');

  const [vehicleTypeData, setVehicleTypeData] = useState([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [model, setModel] = useState([]);

  const [selected, setSelected] = useState(false);
  const[tenant, setTenant] =useState('');
  const[error, setError] =useState(null);


  const PRECON_MODEL_API_URL = `${PRECON_BASE_URL}${SERIES}${tenant}`;

  useEffect(() => {
    (async () => {
      const connection = await attach({ id: priConExtensionId })
      setGuestConnection(connection);
    })()
  }, [])

  useEffect(() => {
    const extensionCORS = async () => {
      try {
        if(guestConnection){
          const state = await guestConnection.host.editorState.get();
          const token = await guestConnection.sharedContext.get('token');
          const org = await guestConnection.sharedContext.get('orgId');
          const location = new URL(state.location);
          const builtHeaders = {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
              'x-aem-host': location.protocol + '//' + location.host,
              'x-gw-ims-org-id': org,
          };
          const response = await fetch(actions["get-metadata"], {
            method: 'POST',
            headers: builtHeaders,
            body: JSON.stringify({ url: location.pathname })
          });
          const responseData = await response.json();
          setTenant(responseData.tenant)
        }
       
      } catch (error) {
        setError(error);
      }
       finally {
        setLoading(false);
      }
    }
    extensionCORS();
  },[priConExtensionId,guestConnection]);

  const onCarSeriesChangeHandler = (value) => {
    const selectedCarSeries = carSerieses.find(model => model.description === value);
    if (selectedCarSeries) {
      const { description, seriesCode } = selectedCarSeries;
      setSelectedCarSeries(description);
      setSeriesCode(seriesCode);
      setSelected(true);
      guestConnection?.host?.field.onChange(`${seriesCode}, ${description}`);
    }
  };

  const onCarModelRangeChangeHandler = (value) => {
    setSelectedCarModelRange(value);
    setRangeCode(value);
    guestConnection?.host?.field.onChange(`${seriesCode},${selectedCarSeries}, ${value}`);
  };

  const onVehicleChangeHandler = (value) => {
    setSelectedVehicleType(value);
    guestConnection?.host?.field.onChange(`${seriesCode},${selectedCarSeries}, ${selectedCarModelRange}, ${value}`);
  };

  useEffect(() => {
    const getDataValue = async () => {
      if(guestConnection){
        const modelData = await guestConnection.host.field.getValue();
        setModel([modelData]);
        if (modelData) {
          const [seriesCode, modelRange, ...type] = modelData.split(', ');
          setSeriesCode(seriesCode.split(',')[0]);
          setSelectedCarSeries(seriesCode.split(',')[1]);
          setSelected(true);
          setRangeCode(modelRange);
          setSelectedCarModelRange(modelRange);
          setPreconId([type[0]]);
          setVehicleTypeData(type);
          setSelectedVehicleType(type.join(', '));
        }
      }  
    }
    getDataValue();
  }, [guestConnection]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if(tenant){
          const response = await fetch(PRECON_MODEL_API_URL);
          const data = await response.json();
          const seriesCodes = Object.values(data).map(item => ({ seriesCode: item.seriesCode, description: item.description }));
          setCarSerieses(Object.values(seriesCodes));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenant]);


  const preconapiURL = `${PRECON_BASE_URL}${RANGE}${tenant}`;
  useEffect(() => {
    const fetchModelRange = async () => {
      if (!seriesCode) return;
      try {
        if(tenant){
          const modelDetailUrl = `${preconapiURL}/${seriesCode}`;
          const modelDetailResponse = await axios.get(modelDetailUrl);
          const modelDetail = modelDetailResponse?.data;
          const rangeCode = Object.values(modelDetail).map(item => item.modelRangeCode);
          setCarModelRange(Object.values(rangeCode));
        }
      } catch (error) {
        console.error('Error fetching details for model', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModelRange();
  }, [tenant,seriesCode]);

  const PRECON_VEHICLES_API_URL = `${PRECON_BASE_URL}${VEHICLES}${tenant}`
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!rangeCode) return;
      try {
        if(tenant){
          const modelDetailUrl = `${PRECON_VEHICLES_API_URL}/${rangeCode}?vehicle_type=PRECON`;
          const response = await axios.get(modelDetailUrl);
          const preConId = Object.values(response?.data).map(item => item?.id);
          setPreconId(preConId);
        }
      } catch (error) {
        console.error('Error fetching details for model', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [tenant,rangeCode]);

  const PRECON_ID_VEHICLE_API_URL = `${PRECON_BASE_URL}${VEHICLE}${tenant}`
  useEffect(() => {
    const fetchVehicleByPreConId = async () => {
      if (!preconId.length) return;
      try {
        if(tenant){
          const vehicleDataPromises = preconId.map(async preconId => {
            const modelDetailUrl = `${PRECON_ID_VEHICLE_API_URL}/${preconId}`;
            const response = await axios.get(modelDetailUrl);
            return response.data;
          });
          const vehiclesData = await Promise.all(vehicleDataPromises);
          const vehicles = vehiclesData.map(vehicle => {
            const { id, name, headline } = vehicle;
            let parts = [];
            if (id) parts.push(id);
            if (name) parts.push(name);
            if (headline) parts.push(headline);
            return parts.join(', ');
          });
          setVehicleTypeData(vehicles);
        }
      } catch (error) {
        console.error('Error fetching details for model', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleByPreConId();
  }, [tenant,preconId]);

  return (
    <Provider theme={lightTheme} colorScheme="light">
      <Flex direction="column">
        <Form isHidden={loading} UNSAFE_className="precon-form">
          <Picker
            label="Series"
            necessityIndicator="label"
            onSelectionChange={onCarSeriesChangeHandler}
            placeholder="Select a series"
            selectedKey={selectedCarSeries}
            isRequired
            description="Defines the Series and related Model Range context."
          >
            {[...new Set(carSerieses)]?.map((item) => (
              <Item textValue={item.description} key={item.description}>{item.description}</Item>
            ))}
          </Picker>
          <Picker
            label="Model Range"
            necessityIndicator="label"
            onSelectionChange={onCarModelRangeChangeHandler}
            placeholder="Select a model"
            isRequired
            description="Defines the Series and related Model Range context."
            isDisabled={!selectedCarSeries}
            selectedKey={selected && selectedCarModelRange}
          >
            {[...new Set(carModelRange)]?.map((rangeCode) => (
              <Item textValue={rangeCode} key={rangeCode}>{rangeCode}</Item>
            ))}
          </Picker>
          <Picker
            label="PreCon ID"
            necessityIndicator="label"
            onSelectionChange={onVehicleChangeHandler}
            placeholder="Select a PreCon Id"
            isRequired
            description="Defines the specific vehicle to be displayed."
            isDisabled={!selectedCarModelRange}
            selectedKey={selectedVehicleType}
          >
            {/* Render "(NO Value)" option if preconData is empty or null */}
            {vehicleTypeData && vehicleTypeData.length > 0 ? (
              [...new Set(vehicleTypeData)].map((item) => (
                <Item key={item} textValue={item}>
                  {item}
                </Item>
              ))
            ) : (
              <Item textValue="(NO Value)">
                (NO Value Find)
              </Item>
            )}
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