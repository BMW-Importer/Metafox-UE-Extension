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
  import { shopByLookExtensionID,SERIES,PRECON_BASE_URL,RANGE,VEHICLE,VEHICLES} from "./Constants";
  import actions from '../config.json';
  
  export default function () {
    const [guestConnection, setGuestConnection] = useState();
    const [loading, setLoading] = useState(true);
  
    const [carSerieses, setCarSerieses] = useState([]);
    const [selectedCarSeries, setSelectedCarSeries] = useState('');
  
    const [seriesCode,setSeriesCode]= useState('');
    const [rangeCode,setRangeCode]= useState('');
    const [shopbylookID,setShopbylookID]= useState([]);
  
    
    const [carModelRange, setCarModelRange] = useState([]);
    const [selectedCarModelRange, setSelectedCarModelRange] = useState('');

    const [vehicleTypeData, setVehicleTypeData] = useState([]);
    const [selectedVehicleType, setSelectedVehicleType] = useState('');
    const [model, setModel] = useState([]);

    const [selected, setSelected] = useState(false);
    const[tenant, setTenant] =useState('');
    const[error, setError] =useState(null);

    const SHOPBYLOOK_MODEL_API_URL = `${PRECON_BASE_URL}${SERIES}/${tenant}`;

    useEffect(() => {
      (async () => {
        const connection = await attach({ id: shopByLookExtensionID })
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
    },[shopByLookExtensionID,guestConnection]);
  
    const onCarSeriesChangeHandler = (value) => {
      setSelectedCarSeries(value);
      setSeriesCode(value);
      setSelected(true);
      guestConnection?.host?.field.onChange(`${value} `);
    };
    
    const onCarModelRangeChangeHandler = (value) => {
      setSelectedCarModelRange(value);
      setRangeCode(value);
      guestConnection?.host?.field.onChange(`${selectedCarSeries}, ${value}`);
    };
  
    const onVehicleChangeHandler = (value) => {
      setSelectedVehicleType(value);
      const shopId = value?.slice(0, 4);
      guestConnection?.host?.field.onChange(`${seriesCode}, ${selectedCarSeries}, ${selectedCarModelRange}, ${shopId}, ${value}`);
    };

    useEffect(() => {
      const getDataValue = async () => {
        if(guestConnection){
          const modelData = await guestConnection.host.field.getValue();
          setModel([modelData]);
          console.log(modelData);
          if (modelData) {
            const [seriesCode, modelRange, ...type] = modelData.split(', ');
            setSeriesCode(seriesCode.split(',')[0]);
            setSelectedCarSeries(seriesCode.split(',')[1]);
            setSelected(true);
            setRangeCode(modelRange);
            setSelectedCarModelRange(modelRange);
            setShopbylookID([type[0]]);
            setVehicleTypeData([type[1]]);
            setSelectedVehicleType([type[1]].join(', '));
          }
        }  
      }
      getDataValue();
    }, [guestConnection]);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          if(tenant){
            const response = await fetch(SHOPBYLOOK_MODEL_API_URL);
            const data = await response.json();
            const seriesCodes = Object.values(data).map(item => item.seriesCode);
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
      
    const shopbylookapiURL = `${PRECON_BASE_URL}${RANGE}${tenant}`;
    useEffect(() => {
      const fetchModelRange = async () => {
        if (!seriesCode) return;
        try {
          if(tenant){
            const modelDetailUrl = `${shopbylookapiURL}/${seriesCode}`;
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
  
    const SHOPBYLOOK_VEHICLES_API_URL = `${PRECON_BASE_URL}${VEHICLES}${tenant}`
    useEffect(() =>{
      const fetchVehicles = async () => {
        if (!rangeCode) return;
        try {
          if(tenant){
            const modelDetailUrl = `${SHOPBYLOOK_VEHICLES_API_URL}/${rangeCode}?vehicle_type=SHOP_THE_LOOK`;
            const response = await axios.get(modelDetailUrl);
            const shopByLookID = Object.values(response?.data).map(item => item?.id);
            setShopbylookID(shopByLookID);
          }
        } catch (error) {
          console.error('Error fetching details for model', error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchVehicles();
  }, [tenant,rangeCode]);
  
  const SHOPBYLOOK_ID_VEHICLE_API_URL = `${PRECON_BASE_URL}${VEHICLE}${tenant}`
  useEffect(() =>{
    const fetchVehicleByPreConId = async () => {
      if (!shopbylookID.length) return;
      try {
        if(tenant){
          const vehicleDataPromises = shopbylookID.map(async shopbylookID => {
            const modelDetailUrl = `${SHOPBYLOOK_ID_VEHICLE_API_URL}/${shopbylookID}`;
            const response = await axios.get(modelDetailUrl);
            return response.data;
          });
          const vehiclesData = await Promise.all(vehicleDataPromises);
          const vehicles = vehiclesData.map(vehicle => {
            const { id, name, headline } = vehicle;
            let parts = [];
            if (id) parts.push(id);
            if (headline) parts.push(headline);
            if (name) parts.push(name);
            return parts.join('  ');
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
  }, [tenant,shopbylookID]);

    return (
      <Provider theme={lightTheme} colorScheme="light">
        <Flex direction="column">
          <Form isHidden={loading}  UNSAFE_className="shop-the-look-form">
            <Picker
              label="Series"
              necessityIndicator="label"
              onSelectionChange={onCarSeriesChangeHandler}
              placeholder="Select a series"
              description="Defines the Series and related Model Range context."
              selectedKey={selectedCarSeries}
              isRequired
            >
              {[...new Set(carSerieses)]?.map((item) => (
                 <Item textValue={item} key={item}>{item}</Item>
              ))}
            </Picker>
            <Picker
              label="Model Range"
              necessityIndicator="label"
              onSelectionChange={onCarModelRangeChangeHandler}
              placeholder="Select a model range"
              isRequired
              description="Defines the Series and related Model Range context."
              isDisabled={!selectedCarSeries}
              selectedKey={selected && selectedCarModelRange}
            >
              {[...new Set(carModelRange)]?.map((rangeCode) => (
                <Item  textValue={rangeCode} key={rangeCode}>{rangeCode}</Item>
              ))}
            </Picker>
            <Picker
              label="Shop the Look ID"
              necessityIndicator="label"
              onSelectionChange={onVehicleChangeHandler}
              placeholder="Shop the Look"
              description="Defines the specific vehicle to be displayed."
              isRequired
              isDisabled={!selectedCarModelRange}
              selectedKey={selectedVehicleType}
            >
              {vehicleTypeData && vehicleTypeData.length > 0 ? (
              [...new Set(vehicleTypeData)].map((item) => (
                 <Item key={item} textValue={item}>
                   {item}
                 </Item>
               ))
             ) : (
               <Item textValue="(NO Value)">
                 (NO Value Found)
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