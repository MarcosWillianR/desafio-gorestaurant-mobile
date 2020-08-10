import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      try {
        const { data } = await api.get(`/foods/${routeParams.id}`);

        setFood({
          ...data,
          formattedPrice: formatValue(data.price),
        });

        setExtras(
          data.extras.map((extra: Omit<Extra, 'quantity'>) => ({
            ...extra,
            quantity: 0,
          })),
        );
      } catch (err) {
        console.log('ERROR LOAD FOOD DETAILS', err);
      }
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    setExtras(state =>
      state.map(extra => {
        if (extra.id === id) {
          return {
            ...extra,
            quantity: extra.quantity + 1,
          };
        }

        return extra;
      }),
    );
  }

  function handleDecrementExtra(id: number): void {
    setExtras(state =>
      state.map(extra => {
        if (extra.id === id) {
          const decrement_quantity = extra.quantity - 1;
          return {
            ...extra,
            quantity: decrement_quantity < 0 ? 0 : decrement_quantity,
          };
        }

        return extra;
      }),
    );
  }

  function handleIncrementFood(): void {
    setFoodQuantity(state => state + 1);
  }

  function handleDecrementFood(): void {
    setFoodQuantity(state => (state - 1 === 0 ? 1 : state - 1));
  }

  const toggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const extrasValue = extras.reduce(
      (acc, extra) => {
        if (extra.quantity > 0) {
          acc.total = extra.quantity * extra.value;
        }

        return acc;
      },
      { total: 0 },
    );

    const foodTotalValue = food.price * foodQuantity;

    const total = extrasValue.total + foodTotalValue;
    const totalFormatted = formatValue(total);

    return { totalFormatted, total };
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    try {
      delete food.id;

      await api.post('orders', {
        ...food,
        price: cartTotal.total,
      });

      navigation.navigate('DashboardStack');
    } catch (err) {
      console.log('ERROR FINISH ORDER', err.response);
    }
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">
              {cartTotal.totalFormatted}
            </TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
